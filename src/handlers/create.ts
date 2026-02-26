import { CALLBACK_ID } from '../consts'
import type { KnownBlock } from '@slack/web-api'
import app from '../slack'

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
          text: '*Dolly is not in this channel!* This means that features are limited. Be warned!',
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
          label: { type: 'plain_text', text: 'Question' },
          element: {
            type: 'plain_text_input',
            initial_value: text,
          },
        },
        {
          type: 'input',
          label: { type: 'plain_text', text: 'Channel to send the poll' },
          element: {
            type: 'conversations_select',
            initial_conversation,
            default_to_current_conversation: true,
          },
        },
      ],
    },
  })
}
