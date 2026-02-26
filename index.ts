import app from './src/slack'

import './src/registry/actions'
import './src/registry/commands'
import './src/registry/shortcuts'

console.log('dolly is starting...')

await app.start()

console.log('dolly has started!')
