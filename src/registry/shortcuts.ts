import { CALLBACK_ID } from '../consts'
import { handleCreatePoll } from '../handlers/create'
import app from '../slack'

app.shortcut(CALLBACK_ID.createPoll, async ({ ack, payload }) => {
  if (payload.type !== 'shortcut') return

  await ack()

  await handleCreatePoll({ trigger_id: payload.trigger_id })
})
