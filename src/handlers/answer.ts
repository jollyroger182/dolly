import type { RespondFn } from '@slack/bolt'
import Responses from '../services/responses'
import Polls from '../services/polls'
import { generatePollBlocks } from '../blocks/poll'

interface TogglePollAnswer {
  respond: RespondFn
  poll: number
  user: string
  choice: number
}

export async function handleTogglePollAnswer({
  respond,
  poll: pollId,
  user,
  choice,
}: TogglePollAnswer) {
  const poll = await Polls.fetch(pollId)
  if (!poll) return

  await Responses.toggle({
    poll: pollId,
    user,
    choice,
    single: !poll.multi_select,
  })

  const data = (await Polls.fetchWithResponses(pollId))!

  await respond({
    replace_original: true,
    blocks: await generatePollBlocks(data),
  })
}

interface ClearResponses {
  respond: RespondFn
  poll: number
  user: string
}

export async function handleClearResponses({
  respond,
  poll,
  user,
}: ClearResponses) {
  await Responses.deleteByUser({ poll, user })

  const data = (await Polls.fetchWithResponses(poll))!

  await respond({
    replace_original: true,
    blocks: await generatePollBlocks(data),
  })
}
