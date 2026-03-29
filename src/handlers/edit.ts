import type { KnownBlock } from '@slack/web-api'
import { generatePollBlocks } from '../blocks/poll'
import { ACTION_ID, BLOCK_ID, CALLBACK_ID } from '../consts'
import Polls from '../services/polls'
import Responses from '../services/responses'
import app from '../slack'
import { handlePollModal } from './modal'
import { delay, showErrorModal } from '../utils'

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
}

export async function handleConfirmEditPoll({
  private_metadata,
  question,
}: ConfirmEditPoll) {
  const { id, response_url } = JSON.parse(private_metadata) as {
    id: number
    response_url: string
  }

  const poll = await Polls.update({ id, question })
  if (!poll) return

  const fullPoll = {
    ...poll,
    choices: await Polls.fetchChoices(id),
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

interface AddOption {
  trigger_id: string
  poll: DB.Poll
  user: string
  response_url: string
}

export async function handleAddOption({
  trigger_id,
  poll,
  user,
  response_url,
}: AddOption) {
  if (poll.add_choice_setting === 'no_one') return
  if (poll.add_choice_setting === 'creator' && user !== poll.creator_user_id) {
    await showErrorModal({
      trigger_id,
      error: 'You cannot add an option to this poll.',
    })
    return
  }

  await app.client.views.open({
    trigger_id,
    view: {
      type: 'modal',
      callback_id: CALLBACK_ID.addOptionModal,
      private_metadata: JSON.stringify({ id: poll.id, response_url }),

      title: { type: 'plain_text', text: 'Add an option' },
      close: { type: 'plain_text', text: 'Cancel' },
      submit: { type: 'plain_text', text: 'Add' },

      blocks: [
        {
          type: 'input',
          block_id: BLOCK_ID.option,
          label: { type: 'plain_text', text: 'Option' },
          element: { type: 'plain_text_input', action_id: ACTION_ID.value },
        },
      ] satisfies KnownBlock[],
    },
  })
}

interface ConfirmAddOption {
  private_metadata: string
  trigger_id: string
  option: string
  user: string
}

export async function handleConfirmAddOption({
  private_metadata,
  trigger_id,
  option,
  user,
}: ConfirmAddOption) {
  const { id, response_url } = JSON.parse(private_metadata) as {
    id: number
    response_url: string
  }

  await Polls.addChoice(id, {
    text: option,
    creator_user_id: user,
  })

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
