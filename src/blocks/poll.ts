import type {
  PlainTextOption,
  ContextBlockElement,
  KnownBlock,
  RichTextBlock,
  RichTextElement,
} from '@slack/web-api'
import app from '../slack'
import { ACTION_ID, BLOCK_ID, VALUE } from '../consts'
import { randomUUIDv7 } from 'bun'
import { generateProgressBar } from './progress'

export async function generatePollBlocks(
  poll: PollWithResponses,
): Promise<KnownBlock[]> {
  const editedElements: ContextBlockElement[] =
    poll.created_at.getTime() !== poll.updated_at.getTime()
      ? [
          {
            type: 'mrkdwn',
            text: `Edited <!date^${Math.floor(poll.updated_at.getTime() / 1000)}^{date_short} at {time}|${poll.updated_at.toISOString()}>`,
          },
        ]
      : []

  const anonymousElements: ContextBlockElement[] = poll.anonymous
    ? [{ type: 'plain_text', text: 'Anonymous poll' }]
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
        ],
      },
    },
    { type: 'divider' },
    await generatePollChoiceBlock(poll.choices, poll.responses, poll),
    {
      type: 'actions',
      elements: [
        {
          type: 'static_select',
          action_id: ACTION_ID.pollChoiceMenu,
          placeholder: { type: 'plain_text', text: 'Choose your answer' },
          options: [
            {
              text: { type: 'plain_text', text: 'Clear answers' },
              value: JSON.stringify({ poll: poll.id, choice: -1 }),
            },
            ...poll.choices.map<PlainTextOption>((choice) => ({
              text: { type: 'plain_text', text: choice.text },
              value: JSON.stringify({ poll: poll.id, choice: choice.id }),
            })),
          ],
        },
      ],
    },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `Asked by <@${poll.creator_user_id}>` },
        ...anonymousElements,
        ...editedElements,
      ],
    },
  ]
}

export async function generatePollChoiceBlock(
  choices: DB.PollChoice[],
  responses: DB.PollResponse[],
  { anonymous }: { anonymous: boolean },
) {
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

  const elements: RichTextElement[] = []

  for (const [index, choice] of choices.entries()) {
    elements.push(
      { type: 'text', text: choice.text, style: { bold: true } },
      { type: 'text', text: '\n' },
    )

    const users = counter.get(choice.id)!
    if (users.length && !anonymous) {
      for (const [index, item] of users.entries()) {
        elements.push({ type: 'user', user_id: item })
        elements.push({
          type: 'text',
          text: index === users.length - 1 ? '\n' : ', ',
        })
      }
    }

    elements.push(
      {
        type: 'text',
        text: generateProgressBar(users.length / total, 20),
        style: { code: true },
      },
      {
        type: 'text',
        text: ` ${Math.round((users.length / total) * 100)}% (${users.length})${index === choices.length - 1 ? '' : '\n'}`,
      },
    )
  }

  return {
    type: 'rich_text',
    elements: [{ type: 'rich_text_section', elements }],
  } satisfies RichTextBlock
}
