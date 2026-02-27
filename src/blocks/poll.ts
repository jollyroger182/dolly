import type { PollWithChoices } from '../services/polls'
import type { ContextBlockElement, KnownBlock } from '@slack/web-api'
import app from '../slack'

export async function generatePollBlocks(
  poll: PollWithChoices,
): Promise<KnownBlock[]> {
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
          alt_text: `Profile picture of creator`,
        },
      ]
    : []

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: poll.question, emoji: true },
    },
    {
      type: 'context',
      elements: [
        ...pfpElements,
        { type: 'mrkdwn', text: `Created by <@${poll.creator_user_id}>` },
      ],
    },
  ]
}
