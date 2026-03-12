import app from './slack'

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface ShowErrorModal {
  trigger_id: string
  error: string
}

export async function showErrorModal({ trigger_id, error }: ShowErrorModal) {
  await app.client.views.open({
    trigger_id,
    view: {
      type: 'modal',
      title: { type: 'plain_text', text: 'Error' },
      blocks: [{ type: 'section', text: { type: 'mrkdwn', text: error } }],
    },
  })
}
