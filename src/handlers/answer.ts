import type { RespondFn } from '@slack/bolt'
import Responses from '../services/responses'
import Polls from '../services/polls'
import { generatePollBlocks } from '../blocks/poll'

interface AnswerPoll {
  respond: RespondFn
  poll: number
  user: string
  choices: number[] | null
}

export async function handleAnswerPoll({
  respond,
  poll,
  user,
  choices,
}: AnswerPoll) {
  if (!choices?.length) {
    await Responses.deleteByUser({ poll, user })
  } else {
    await Responses.createOrReplace({ poll, user, choices })
  }

  const data = (await Polls.fetchWithResponses(poll))!

  await respond({
    replace_original: true,
    blocks: await generatePollBlocks(data),
  })
}
