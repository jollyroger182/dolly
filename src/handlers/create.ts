import { BLOCK_ID, CALLBACK_ID, VALUE_ACTION } from '../consts'
import type { KnownBlock } from '@slack/web-api'
import app from '../slack'
import type { RespondFn } from '@slack/bolt'
import Polls from '../services/polls'
import { generatePollBlocks } from '../blocks/poll'

interface CreatePollArguments {
  trigger_id: string
  initial_conversation?: string
  text?: string
}

export async function handleCreatePoll({
  trigger_id,
  initial_conversation,
  text,
}: CreatePollArguments) {
  const hintBlocks: KnownBlock[] = []
  if (initial_conversation) {
    try {
      await app.client.conversations.info({
        channel: initial_conversation,
      })
    } catch {
      hintBlocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Dolly is not in this channel!* This means that some features may not work as intended.',
        },
      })
    }
  }

  return await app.client.views.open({
    trigger_id,
    view: {
      type: 'modal',
      callback_id: CALLBACK_ID.createPollModal,

      title: { type: 'plain_text', text: 'Create a poll' },
      close: { type: 'plain_text', text: 'Cancel' },
      submit: { type: 'plain_text', text: 'Create' },

      blocks: [
        ...hintBlocks,
        {
          type: 'input',
          block_id: BLOCK_ID.question,
          label: { type: 'plain_text', text: 'Question' },
          element: {
            type: 'plain_text_input',
            action_id: VALUE_ACTION,
            initial_value: text,
          },
        },
        {
          type: 'input',
          block_id: BLOCK_ID.channel,
          label: { type: 'plain_text', text: 'Channel to send the poll' },
          element: {
            type: 'conversations_select',
            action_id: VALUE_ACTION,
            initial_conversation,
            default_to_current_conversation: true,
            response_url_enabled: true,
          },
        },
      ],
    },
  })
}

interface ConfirmCreatePollOptions {
  respond: RespondFn
  user: string
  question: string
  choices: string[]
}

export async function handleConfirmCreatePoll({
  respond,
  user,
  question,
  choices,
}: ConfirmCreatePollOptions) {
  console.log('create', question)

  const poll = await Polls.create({ user, question, choices })

  const blocks = await generatePollBlocks({ ...poll, responses: [] })

  await respond({ blocks, response_type: 'in_channel' })
}
