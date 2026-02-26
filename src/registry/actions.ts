import { CALLBACK_ID } from '../consts'
import app from '../slack'

app.view(CALLBACK_ID.createPollModal, async ({ack, payload}) => {
  await ack()

  console.log(payload)
})
