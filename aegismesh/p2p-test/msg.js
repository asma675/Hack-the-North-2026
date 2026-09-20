const Hyperswarm = require('hyperswarm')
const crypto = require('crypto')

const name = process.argv[2] || 'peer'
const topic = crypto.createHash('sha256').update('aegis-hello-test').digest()
const swarm = new Hyperswarm()

swarm.on('connection', (conn) => {
  console.log('CONNECTED to a peer')
  let buf = ''
  conn.on('data', (d) => {
    buf += d.toString()
    let i
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i)
      buf = buf.slice(i + 1)
      try {
        const m = JSON.parse(line)
        console.log('got', m.type, 'from', m.from, JSON.stringify(m.data))
      } catch (e) {}
    }
  })
  let n = 0
  const timer = setInterval(() => {
    n++
    const msg = { from: name, type: 'state', data: { incidentState: 'INVESTIGATING', n: n }, ts: Date.now() }
    conn.write(JSON.stringify(msg) + '\n')
  }, 2000)
  conn.on('error', () => {})
  conn.on('close', () => { clearInterval(timer); console.log('peer left') })
})

swarm.join(topic)
console.log(name, 'looking for a peer...')
