import { handleCreatePoll } from '../handlers/create'
import app from '../slack'

app.command(/^\/.*dolly$/, async ({ ack, payload }) => {
  await ack()
  await handleCreatePoll({
    trigger_id: payload.trigger_id,
    text: payload.text,
    initial_conversation: payload.channel_id,
  })
})
