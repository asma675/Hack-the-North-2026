import Hyperswarm from 'hyperswarm'
import crypto from 'crypto'

const name = process.argv[2] || 'peer'
const topic = crypto.createHash('sha256').update('aegis-hello-test').digest()

const swarm = new Hyperswarm()

swarm.on('connection', (conn) => {
  console.log('CONNECTED to a peer')
  const timer = setInterval(() => conn.write(`hello from ${name}`), 2000)
  conn.on('data', (d) => console.log('received:', d.toString()))
  conn.on('error', (e) => console.log('conn error:', e.message))
  conn.on('close', () => {
    clearInterval(timer)
    console.log('peer left')
  })
})

const discovery = swarm.join(topic, { server: true, client: true })
await discovery.flushed()
console.log(name, 'announced, waiting for a peer...')
