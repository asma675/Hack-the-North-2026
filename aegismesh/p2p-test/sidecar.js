// partner laptop:  node sidecar.js software
// hardware laptop: node sidecar.js hardware
const Hyperswarm = require('hyperswarm')
const crypto = require('crypto')
const http = require('http')

const role = process.argv[2]
if (role !== 'software' && role !== 'hardware') {
  console.log('usage: node sidecar.js software|hardware')
  process.exit(1)
}
const PORT = 8788
const SECRET = process.env.AEGIS_SECRET || 'change-me-hack-the-north'
const topic = crypto.createHash('sha256').update('aegis-topic:' + SECRET).digest()
const hmacKey = crypto.createHash('sha256').update('aegis-hmac:' + SECRET).digest()
const sign = (s) => crypto.createHmac('sha256', hmacKey).update(s).digest('hex')

const conns = new Set()
let latest = null   // hardware: last state received from the peer
let latestAt = 0
let pending = []    // software: approvals waiting for the browser

function send(msg) {
  const line = JSON.stringify(msg) + '\n'
  for (const c of conns) c.write(line)
}

function onMessage(m) {
  if (role === 'hardware' && m.type === 'state') {
    latest = m.state
    latestAt = Date.now()
  }
  if (role === 'software' && m.type === 'approve') {
    const okSig = sign(m.source + ':' + m.ts) === m.sig
    const fresh = Math.abs(Date.now() - m.ts) < 60000
    if (!okSig || !fresh) return console.log('REJECTED approval: bad signature or stale')
    console.log('verified approval from', m.source)
    pending.push({ source: m.source, ts: m.ts })
  }
}

const swarm = new Hyperswarm()
swarm.on('connection', (conn) => {
  console.log('peer connected')
  conns.add(conn)
  let buf = ''
  conn.on('data', (d) => {
    buf += d.toString()
    let i
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i)
      buf = buf.slice(i + 1)
      try { onMessage(JSON.parse(line)) } catch (e) {}
    }
  })
  conn.on('error', () => {})
  conn.on('close', () => { conns.delete(conn); console.log('peer left') })
})
swarm.join(topic)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Private-Network': 'true'
}

function readBody(req, cb) {
  let b = ''
  req.on('data', (d) => { b += d })
  req.on('end', () => { try { cb(JSON.parse(b || '{}')) } catch (e) { cb(null) } })
}

http.createServer((req, res) => {
  const json = (o, code = 200) => {
    res.writeHead(code, Object.assign({ 'Content-Type': 'application/json' }, CORS))
    res.end(JSON.stringify(o))
  }
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end() }
  const url = req.url.split('?')[0]

  if (role === 'software') {
    if (req.method === 'POST' && url === '/state') {
      return readBody(req, (state) => {
        if (!state) return json({ ok: false }, 400)
        send({ type: 'state', state })
        json({ ok: true })
      })
    }
    if (req.method === 'GET' && url === '/approvals') {
      const out = pending.filter((a) => Date.now() - a.ts < 30000)
      pending = []
      return json({ approvals: out })
    }
  }

  if (role === 'hardware') {
    if (req.method === 'GET' && url === '/api/runtime/state') {
      if (latest && Date.now() - latestAt < 3000) return json(latest)
      return json({ incidentState: 'LINK_LOST', agents: {} })
    }
    if (req.method === 'POST' && url === '/api/runtime/approve') {
      return readBody(req, (b) => {
        if (!latest || latest.incidentState !== 'APPROVAL') {
          return json({ ok: false, error: 'nothing awaiting approval' }, 409)
        }
        const source = (b && b.source) || 'fingerprint'
        const ts = Date.now()
        send({ type: 'approve', source, ts, sig: sign(source + ':' + ts) })
        console.log('sent approval:', source)
        json({ ok: true })
      })
    }
  }
  json({ error: 'not found' }, 404)
}).listen(PORT, role === 'hardware' ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(role, 'sidecar on port', PORT, '- looking for peer...')
})
