import { generatePollBlocks } from '../blocks/poll'
import { ACTION_ID, BLOCK_ID, CALLBACK_ID, VALUE_ACTION } from '../consts'
import { handleConfirmCreatePoll } from '../handlers/create'
import Polls from '../services/polls'
import Responses from '../services/responses'
import app from '../slack'

app.view(
  CALLBACK_ID.createPollModal,
  async ({ ack, respond, payload, body }) => {
    await ack()

    const question =
      payload.state.values[BLOCK_ID.question]![VALUE_ACTION]!.value!

    const choices = ['Option 1', 'Option 2', 'option 3']

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
