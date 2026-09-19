// Agent Durable Object — manages per-agent state, A2A messages, trust history, events.
export class AgentDurableObject {
  constructor(initializedState) {
    this.storage = initializedState.storage;
    this.agentKey = initializedState.id;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || request.headers.get('x-action');

    switch (action) {
      case 'getState': return this.getState();
      case 'setState': return this.setState(request);
      case 'addEvent': return this.addEvent(request);
      case 'addTrustEntry': return this.addTrustEntry(request);
      case 'getEvents': return this.getEvents(request);
      case 'updateStatus': return this.updateStatus(request);
      case 'incrementViolations': return this.incrementViolations(request);
      case 'getSummary': return this.getSummary();
      case 'a2a_send': return this.a2aSend(request);
      case 'a2a_getMessages': return this.a2aGetMessages(request);
      case 'a2a_getConversation': return this.a2aGetConversation(request);
      default: return new Response(JSON.stringify({ error: 'unknown action' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }
  }

  async getState() {
    const raw = await this.storage.get('agent-state');
    return new Response(raw || JSON.stringify({ status: 'IDLE', trust_score: 0, events: [] }), { headers: { 'content-type': 'application/json' } });
  }

  async setState(request) {
    const body = await request.json();
    await this.storage.put('agent-state', JSON.stringify(body));
    await this.storage.put('agent-state-updated', new Date().toISOString());
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  }

  async addEvent(request) {
    const body = await request.json();
    const eventsRaw = await this.storage.get('events') || '[]';
    const events = JSON.parse(eventsRaw);
    events.push({ ...body, ts: Date.now() });
    if (events.length > 200) events.splice(0, events.length - 200);
    await this.storage.put('events', JSON.stringify(events));
    if (this.agentKey) {
      try {
        await this.storage.put(`agent:${this.agentKey}:events`, JSON.stringify(events));
      } catch {}
    }
    return new Response(JSON.stringify({ ok: true, count: events.length }), { headers: { 'content-type': 'application/json' } });
  }

  async addTrustEntry(request) {
    const body = await request.json();
    const raw = await this.storage.get('trust-history') || '[]';
    const history = JSON.parse(raw);
    history.push({ date: new Date().toISOString(), trust: body.trust, reason: body.reason });
    if (history.length > 50) history.splice(0, history.length - 50);
    await this.storage.put('trust-history', JSON.stringify(history));
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  }

  async getEvents(request) {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || 50);
    const raw = await this.storage.get('events') || '[]';
    const events = JSON.parse(raw).slice(-limit);
    return new Response(JSON.stringify(events), { headers: { 'content-type': 'application/json' } });
  }

  async updateStatus(request) {
    const body = await request.json();
    const state = JSON.parse(await this.storage.get('agent-state') || '{}');
    Object.assign(state, { status: body.status, quarantined: body.quarantined || false });
    await this.storage.put('agent-state', JSON.stringify(state));
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  }

  async incrementViolations(request) {
    const state = JSON.parse(await this.storage.get('agent-state') || '{}');
    state.violations = (state.violations || 0) + 1;
    await this.storage.put('agent-state', JSON.stringify(state));
    return new Response(JSON.stringify({ ok: true, violations: state.violations }), { headers: { 'content-type': 'application/json' } });
  }

  async getSummary() {
    const state = JSON.parse(await this.storage.get('agent-state') || '{}');
    const events = JSON.parse(await this.storage.get('events') || '[]');
    const trust = JSON.parse(await this.storage.get('trust-history') || '[]');
    const skillsRaw = await this.storage.get('skills') || '[]';
    return new Response(JSON.stringify({
      agentKey: this.agentKey,
      state, events, trustHistory: trust.slice(-10),
      skills: JSON.parse(skillsRaw),
      updatedAt: await this.storage.get('agent-state-updated'),
    }), { headers: { 'content-type': 'application/json' } });
  }

  async a2aSend(request) {
    const body = await request.json();
    const { from, to, content, type: msgType = 'text' } = body;
    const convId = `conv:${[from || this.agentKey, to].sort().join('+')}`;
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from: from || this.agentKey,
      to,
      content,
      type: msgType,
      timestamp: Date.now(),
      read: false,
    };
    const messagesRaw = await this.storage.get(`conv:${convId}:messages`) || '[]';
    const messages = JSON.parse(messagesRaw);
    messages.push(message);
    await this.storage.put(`conv:${convId}:messages`, JSON.stringify(messages));
    return new Response(JSON.stringify({ ok: true, message }), { headers: { 'content-type': 'application/json' } });
  }

  async a2aGetMessages(request) {
    const url = new URL(request.url);
    const otherAgent = url.searchParams.get('with') || '';
    const convId = otherAgent ? `conv:${[this.agentKey, otherAgent].sort().join('+')}` : null;
    if (!convId) return new Response(JSON.stringify({ messages: [] }), { headers: { 'content-type': 'application/json' } });
    const raw = await this.storage.get(`conv:${convId}:messages`) || '[]';
    return new Response(JSON.stringify(JSON.parse(raw)), { headers: { 'content-type': 'application/json' } });
  }

  async a2aGetConversation(request) {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || 100);
    const keys = [];
    const allMessages = [];
    let cursor = null;
    do {
      cursor = await this.storage.list({ prefix: 'conv:', cursor, limit: 10 });
      for (const k of cursor.keys) {
        try {
          const name = k.name;
          if (name.startsWith('conv:') && name.endsWith(':messages')) {
            const msgs = JSON.parse(await this.storage.get(name) || '[]');
            allMessages.push(...msgs);
            keys.push(name);
          }
        } catch {}
      }
    } while (cursor.cursor);
    allMessages.sort((a, b) => a.timestamp - b.timestamp);
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = allMessages.filter(m => m.timestamp > cutoff).slice(-limit);
    return new Response(JSON.stringify({ messages: recent, count: recent.length }), { headers: { 'content-type': 'application/json' } });
  }
}
