import type {
  PollResponseWithAnswers,
  PollWithChoices,
  PollWithResponses,
} from '../services/polls'
import type {
  ContextBlockElement,
  KnownBlock,
  RichTextBlock,
  RichTextElement,
} from '@slack/web-api'
import app from '../slack'
import { ACTION_ID } from '../consts'
import { randomUUIDv7 } from 'bun'
import { generateProgressBar } from './progress'

export async function generatePollBlocks(
  poll: PollWithResponses,
): Promise<KnownBlock[]> {
  console.log(poll)

  let pfp: string | undefined
  try {
    const user = await app.client.users.info({ user: poll.creator_user_id })
    pfp = user.user?.profile?.image_original || user.user?.profile?.image_512
  } catch (e) {
    console.error(
      `fetching user ${poll.creator_user_id} for poll ${poll.id} failed`,
      e,
    )
  }

  const pfpElements: ContextBlockElement[] = pfp
    ? [
        {
          type: 'image',
          image_url: pfp,
          alt_text: `Profile picture`,
        },
      ]
    : []

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
      text: { type: 'mrkdwn', text: `*${poll.question}*` },
    },
    {
      type: 'actions',
      elements: poll.choices.map((choice) => ({
        type: 'button',
        text: { type: 'plain_text', text: choice.text },
        action_id: `${ACTION_ID.pollChoiceButton}_${randomUUIDv7()}`,
        value: `${choice.id}`,
      })),
    },
    await generatePollChoiceBlock(poll.choices, poll.responses),
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `By <@${poll.creator_user_id}>` },
        // ...pfpElements,
        ...editedElements,
      ],
    },
  ]
}

export async function generatePollChoiceBlock(
  choices: DB.PollChoice[],
  responses: PollResponseWithAnswers[],
) {
  const counter = new Map<number, string[]>()
  let total = 0
  for (const choice of choices) {
    counter.set(choice.id, [])
  }
  for (const response of responses) {
    for (const answer of response.answers) {
      counter.get(answer.choice_id)!.push(response.user_id)
      total++
    }
  }
  if (!total) total = 1

  const elements: RichTextElement[] = []

  for (const [index, choice] of choices.entries()) {
    elements.push(
      { type: 'text', text: choice.text, style: { bold: true } },
      { type: 'text', text: '\n' },
    )

    const users = counter.get(choice.id)!
    if (users.length) {
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
