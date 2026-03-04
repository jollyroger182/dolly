import { ACTION_ID, BLOCK_ID, CALLBACK_ID, VALUE } from '../consts'
import type { KnownBlock } from '@slack/web-api'
import app from '../slack'
import type { RespondFn } from '@slack/bolt'
import Polls from '../services/polls'
import { generatePollBlocks } from '../blocks/poll'

interface CreatePollArguments {
  trigger_id: string
  initial_conversation?: string
  text?: string
  options?: string
  error?: string
}

export async function handleCreatePoll({
  trigger_id,
  initial_conversation,
  text,
  options,
  error,
}: CreatePollArguments) {
  const errorBlocks: KnownBlock[] = error
    ? [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Error:* ${error}` },
        },
      ]
    : []

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
        ...errorBlocks,
        ...hintBlocks,
        {
          type: 'input',
          block_id: BLOCK_ID.question,
          label: { type: 'plain_text', text: 'Question' },
          element: {
            type: 'plain_text_input',
            action_id: ACTION_ID.value,
            initial_value: text,
          },
        },
        {
          type: 'input',
          block_id: BLOCK_ID.channel,
          label: { type: 'plain_text', text: 'Channel to send the poll' },
          element: {
            type: 'conversations_select',
            action_id: ACTION_ID.value,
            initial_conversation,
            default_to_current_conversation: true,
            response_url_enabled: true,
          },
        },
        {
          type: 'input',
          block_id: BLOCK_ID.options,
          label: { type: 'plain_text', text: 'Options (one on each line)' },
          element: {
            type: 'plain_text_input',
            action_id: ACTION_ID.value,
            multiline: true,
            initial_value: options,
          },
        },
        {
          type: 'input',
          block_id: BLOCK_ID.settings,
          label: { type: 'plain_text', text: 'Options' },
          element: {
            type: 'checkboxes',
            action_id: ACTION_ID.value,
            options: [
              {
                text: { type: 'plain_text', text: 'Anonymous poll' },
                value: VALUE.anonymous,
              },
            ],
          },
          optional: true,
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
  anonymous: boolean
}

export async function handleConfirmCreatePoll({
  respond,
  user,
  question,
  choices,
  anonymous,
}: ConfirmCreatePollOptions) {
  console.log('create', question)

  const poll = await Polls.create({ user, question, choices, anonymous })

  const blocks = await generatePollBlocks({ ...poll, responses: [] })

  await respond({ blocks, response_type: 'in_channel' })
}
