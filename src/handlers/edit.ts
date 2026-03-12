import type { KnownBlock } from '@slack/web-api'
import { generatePollBlocks } from '../blocks/poll'
import { CALLBACK_ID } from '../consts'
import Polls from '../services/polls'
import Responses from '../services/responses'
import app from '../slack'
import { handlePollModal } from './modal'
import { delay } from '../utils'

interface EditPollArguments {
  trigger_id: string
  poll: PollWithChoices
  response_url: string
  error?: string
}

export async function handleEditPoll({
  trigger_id,
  poll,
  response_url,
  error,
}: EditPollArguments) {
  return await handlePollModal({
    trigger_id,
    callback_id: CALLBACK_ID.editPollModal,
    private_metadata: JSON.stringify({ id: poll.id, response_url }),
    text: poll.question,
    options: poll.choices.map((c) => c.text).join('\n'),
    error,
    edit: true,
  })
}

interface ConfirmEditPoll {
  private_metadata: string
  trigger_id: string
  question: string
  choices: string[]
}

export async function handleConfirmEditPoll(params: ConfirmEditPoll) {
  const { private_metadata, question, choices } = params

  const { id, response_url } = JSON.parse(private_metadata) as {
    id: number
    response_url: string
  }

  const poll = await Polls.update({ id, question })
  if (!poll) return

  const oldChoices = await Polls.fetchChoices(id)
  const choiceChanges = matchChoices(oldChoices, choices)
  if (choiceChanges.changed) {
    await delay(500)
    await confirmEditChoices(poll, params, choiceChanges)
    return
  }

  const fullPoll = {
    ...poll,
    choices: oldChoices,
    responses: await Responses.fetchByPoll(id),
  }

  const payload = {
    replace_original: true,
    blocks: await generatePollBlocks(fullPoll),
  }

  await fetch(response_url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

interface ConfirmEditChoices {
  private_metadata: string
}

export async function handleConfirmEditChoices({
  private_metadata,
}: ConfirmEditChoices) {
  const { id, response_url, changes } = JSON.parse(private_metadata) as {
    id: number
    response_url: string
    changes: { added: string[]; deleted: number[] }
  }

  await Polls.changeChoices(id, changes.added, changes.deleted)

  const poll = await Polls.fetchWithResponses(id)
  if (!poll) return

  const payload = {
    replace_original: true,
    blocks: await generatePollBlocks(poll),
  }

  await fetch(response_url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

function matchChoices(old: DB.PollChoice[], updated: string[]) {
  const deleted: DB.PollChoice[] = []
  const remaining = [...updated]

  for (const choice of old) {
    const idx = remaining.indexOf(choice.text)
    if (idx >= 0) {
      remaining.splice(idx, 1)
      continue
    }
    deleted.push(choice)
  }

  return {
    changed: !!(deleted.length || remaining.length),
    deleted,
    added: remaining,
  }
}

async function confirmEditChoices(
  poll: DB.Poll,
  params: ConfirmEditPoll,
  match: ReturnType<typeof matchChoices>,
) {
  const { response_url } = JSON.parse(params.private_metadata) as {
    id: number
    response_url: string
  }

  const addedBlocks: KnownBlock[] = match.added.length
    ? [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Added choices:*\n${match.added.map((c) => `* ${c}`).join('\n')}`,
          },
        },
      ]
    : []

  const removedBlocks: KnownBlock[] = match.deleted.length
    ? [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Deleted choices* (any votes will be deleted):\n${match.deleted.map((c) => `* ${c.text}`).join('\n')}`,
          },
        },
      ]
    : []

  await app.client.views.open({
    trigger_id: params.trigger_id,
    view: {
      type: 'modal',
      callback_id: CALLBACK_ID.confirmEditChoices,
      private_metadata: JSON.stringify({
        id: poll.id,
        response_url,
        changes: {
          added: match.added,
          deleted: match.deleted.map((c) => c.id),
        },
      }),

      title: { type: 'plain_text', text: 'Confirm edit' },
      close: { type: 'plain_text', text: 'Cancel' },
      submit: { type: 'plain_text', text: 'Confirm' },

      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'You have edited the choices of your poll. Please confirm the following changes. The poll results will be updated.',
          },
        },
        ...addedBlocks,
        ...removedBlocks,
      ],
    },
  })
}
