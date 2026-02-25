import app from './src/slack'

console.log('dolly is starting...')

app.command(/^\/.*dolly$/, async ({ ack }) => {
  await ack('hello world')
})

await app.start()

console.log('dolly has started!')
