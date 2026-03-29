import { CALLBACK_ID } from '../consts'
import type { RespondFn } from '@slack/bolt'
import Polls from '../services/polls'
import { generatePollBlocks } from '../blocks/poll'
import { handlePollModal } from './modal'

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
  return await handlePollModal({
    trigger_id,
    callback_id: CALLBACK_ID.createPollModal,
    initial_conversation,
    text,
    options,
    error,
  })
}

interface ConfirmCreatePollOptions {
  respond: RespondFn
  user: string
  question: string
  choices: string[]
  anonymous: boolean
  multi_select: boolean
  add_choice_setting: 'no_one' | 'creator' | 'anyone'
}

export async function handleConfirmCreatePoll({
  respond,
  user,
  question,
  choices,
  anonymous,
  multi_select,
  add_choice_setting,
}: ConfirmCreatePollOptions) {
  console.log('create', question)

  const poll = await Polls.create({
    user,
    question,
    choices,
    anonymous,
    multi_select,
    add_choice_setting,
  })

  const blocks = await generatePollBlocks({ ...poll, responses: [] })

  await respond({ blocks, response_type: 'in_channel' })
}
