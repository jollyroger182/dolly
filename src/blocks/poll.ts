import type {
  PlainTextOption,
  ContextBlockElement,
  KnownBlock,
  SectionBlock,
} from '@slack/web-api'
import { ACTION_ID, BLOCK_ID, VALUE } from '../consts'
import { generateProgressBar } from './progress'

export async function generatePollBlocks(
  poll: PollWithResponses,
): Promise<KnownBlock[]> {
  // const addChoiceBlocks: KnownBlock[] =
  //   poll.add_choice_setting === 'no_one'
  //     ? []
  //     : [
  //         {
  //           type: 'input',
  //           label: { type: 'plain_text', text: 'Add an option' },
  //           element: {
  //             type: 'plain_text_input',
  //             dispatch_action_config: {
  //               trigger_actions_on: ['on_enter_pressed'],
  //             },
  //             placeholder: { type: 'plain_text', text: 'Add an option...' },
  //           },
  //           hint: {
  //             type: 'plain_text',
  //             text:
  //               poll.add_choice_setting === 'anyone'
  //                 ? 'Anyone can add options.'
  //                 : 'Only the poll creator can add options.',
  //           },
  //         },
  //       ]

  const addChoiceOptions: PlainTextOption[] =
    poll.add_choice_setting === 'no_one'
      ? []
      : [
          {
            text: { type: 'plain_text', text: 'Add option' },
            value: VALUE.addOption,
          },
        ]

  const anonymousElements: ContextBlockElement[] = poll.anonymous
    ? [{ type: 'plain_text', text: 'Anonymous poll' }]
    : []

  const multiElements: ContextBlockElement[] = poll.multi_select
    ? [{ type: 'plain_text', text: 'Multi-select' }]
    : []

  const addChoiceElements: ContextBlockElement[] =
    poll.add_choice_setting === 'no_one'
      ? []
      : [
          {
            type: 'plain_text',
            text:
              poll.add_choice_setting === 'anyone'
                ? 'Anyone can add options'
                : 'Only the creator can add options',
          },
        ]

  const editedElements: ContextBlockElement[] =
    poll.created_at.getTime() !== poll.updated_at.getTime()
      ? [
          {
            type: 'mrkdwn',
            text: `Edited <!date^${Math.floor(poll.updated_at.getTime() / 1000)}^{date_short} at {time}|${poll.updated_at.toISOString()}>`,
          },
        ]
      : []

  return [
    {
      type: 'section',
      block_id: BLOCK_ID.pollTitle,
      text: { type: 'mrkdwn', text: `*${poll.question}*` },
      accessory: {
        type: 'overflow',
        action_id: JSON.stringify({ poll: poll.id }),
        options: [
          { text: { type: 'plain_text', text: 'Edit' }, value: VALUE.edit },
          { text: { type: 'plain_text', text: 'Delete' }, value: VALUE.delete },
          ...addChoiceOptions,
        ],
      },
    },
    { type: 'divider' },
    await generatePollChoiceBlock(poll),
    {
      type: 'actions',
      elements: [
        {
          type: 'static_select',
          action_id: ACTION_ID.pollChoiceMenu,
          placeholder: { type: 'plain_text', text: 'Choose your answer' },
          options: [
            {
              text: { type: 'plain_text', text: '--- Clear answers ---' },
              value: JSON.stringify({ poll: poll.id, choice: -1 }),
            },
            {
              text: { type: 'plain_text', text: '--- Add an option ---' },
              value: JSON.stringify({ poll: poll.id, choice: -2 }),
            },
            ...poll.choices.map<PlainTextOption>((choice) => ({
              text: { type: 'plain_text', text: choice.text },
              value: JSON.stringify({ poll: poll.id, choice: choice.id }),
            })),
          ],
        },
      ],
    },
    // ...addChoiceBlocks,
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `Asked by <@${poll.creator_user_id}>` },
        ...anonymousElements,
        ...multiElements,
        ...addChoiceElements,
        ...editedElements,
      ],
    },
  ]
}

export async function generatePollChoiceBlock({
  choices,
  responses,
  anonymous,
  add_choice_setting,
}: PollWithResponses) {
  const counter = new Map<number, string[]>()
  let total = 0
  for (const choice of choices) {
    counter.set(choice.id, [])
  }
  for (const response of responses) {
    counter.get(response.choice_id)!.push(response.user_id)
    total++
  }
  if (!total) total = 1

  let text = ''

  for (const [index, choice] of choices.entries()) {
    if (add_choice_setting === 'anyone') {
      text += `<@${choice.creator_user_id}>: `
    }
    text += `*${choice.text}*\n`

    const users = counter.get(choice.id)!
    if (users.length && !anonymous) {
      text += users
        .values()
        .map((u) => `<@${u}>`)
        .toArray()
        .join(', ')
      text += '\n'
    }

    text += `\`\u2060${generateProgressBar(users.length / total, 20)}\u2060\` ${Math.round((users.length / total) * 100)}% (${users.length})${index === choices.length - 1 ? '' : '\n'}\n`
  }

  return {
    type: 'section',
    text: { type: 'mrkdwn', text: text.trim() },
  } satisfies SectionBlock
}
