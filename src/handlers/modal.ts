import { ACTION_ID, BLOCK_ID, VALUE } from '../consts'
import type { KnownBlock } from '@slack/web-api'
import app from '../slack'

interface PollModalArguments {
  trigger_id: string
  callback_id: string
  private_metadata?: string
  initial_conversation?: string
  text?: string
  options?: string
  error?: string
  edit?: boolean
}

export async function handlePollModal({
  trigger_id,
  callback_id,
  private_metadata,
  initial_conversation,
  text,
  options,
  error,
  edit,
}: PollModalArguments) {
  const errorBlocks: KnownBlock[] = error
    ? [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Error:* ${error}` },
        },
      ]
    : []

  const channelBlocks: KnownBlock[] = edit
    ? []
    : [
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
      ]

  const optionsBlocks: KnownBlock[] = edit
    ? []
    : [
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
      ]

  const settingsBlocks: KnownBlock[] = edit
    ? []
    : [
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
              {
                text: { type: 'plain_text', text: 'Multi-select' },
                value: VALUE.multiSelect,
              },
            ],
          },
          optional: true,
        },
        {
          type: 'input',
          block_id: BLOCK_ID.addChoiceSettings,
          label: { type: 'plain_text', text: 'Who can add options' },
          hint: {
            type: 'plain_text',
            text: 'Choose who can add options to this poll after creation.',
          },
          element: {
            type: 'static_select',
            action_id: ACTION_ID.value,
            options: [
              {
                text: { type: 'plain_text', text: 'No one' },
                value: VALUE.noOne,
              },
              {
                text: { type: 'plain_text', text: 'You only' },
                value: VALUE.creator,
              },
              {
                text: { type: 'plain_text', text: 'Anyone' },
                value: VALUE.anyone,
              },
            ],
            initial_option: {
              text: { type: 'plain_text', text: 'No one' },
              value: VALUE.noOne,
            },
          },
        },
      ]

  return await app.client.views.open({
    trigger_id,
    view: {
      type: 'modal',
      callback_id: callback_id,
      private_metadata,

      title: { type: 'plain_text', text: edit ? 'Edit poll' : 'Create a poll' },
      close: { type: 'plain_text', text: 'Cancel' },
      submit: { type: 'plain_text', text: edit ? 'Save' : 'Create' },

      blocks: [
        ...errorBlocks,
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
        ...channelBlocks,
        ...optionsBlocks,
        ...settingsBlocks,
      ],
    },
  })
}
