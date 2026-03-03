import { generatePollBlocks } from '../blocks/poll'
import { ACTION_ID, BLOCK_ID, CALLBACK_ID } from '../consts'
import { handleConfirmCreatePoll, handleCreatePoll } from '../handlers/create'
import Polls from '../services/polls'
import Responses from '../services/responses'
import app from '../slack'

app.view(
  CALLBACK_ID.createPollModal,
  async ({ ack, respond, payload, body }) => {
    if (body.type !== 'view_submission') return

    await ack()

    const conversation =
      payload.state.values[BLOCK_ID.channel]![ACTION_ID.value]!
        .selected_conversation!
    const question =
      payload.state.values[BLOCK_ID.question]![ACTION_ID.value]!.value!
    const choices = payload.state.values[BLOCK_ID.options]![
      ACTION_ID.value
    ]!.value!.trim()
      .split('\n')
      .filter((c) => c)

    if (choices.length < 2) {
      await handleCreatePoll({
        trigger_id: body.trigger_id,
        initial_conversation: conversation,
        text: question,
        options: choices.join('\n'),
        error: "What's a poll without two or more choices?",
      })
      return
    }

    await handleConfirmCreatePoll({
      respond,
      user: body.user.id,
      question,
      choices,
    })
  },
)

app.action(
  ACTION_ID.pollChoiceMenu,
  async ({ ack, respond, payload, body }) => {
    if (body.type !== 'block_actions') return
    if (payload.type !== 'static_select') return

    await ack()

    const answerValue = payload.selected_option.value
    const { poll: pollId, choice: choiceId } = JSON.parse(answerValue) as {
      poll: number
      choice: number
    }

    if (choiceId === -1) {
      await Responses.deleteByUser({
        poll: pollId,
        user: body.user.id,
      })
    } else {
      await Responses.createOrReplace({
        poll: pollId,
        user: body.user.id,
        choices: [choiceId],
      })
    }

    const poll = (await Polls.fetchWithResponses(pollId))!

    await respond({
      replace_original: true,
      blocks: await generatePollBlocks(poll),
    })
  },
)
