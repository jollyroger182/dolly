import { BLOCK_ID, CALLBACK_ID, VALUE_ACTION } from '../consts'
import { handleConfirmCreatePoll } from '../handlers/create'
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
