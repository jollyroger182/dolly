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
  poll,
  user,
  choice,
}: TogglePollAnswer) {
  await Responses.toggle({ poll, user, choice, single: true })

  const data = (await Polls.fetchWithResponses(poll))!

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
