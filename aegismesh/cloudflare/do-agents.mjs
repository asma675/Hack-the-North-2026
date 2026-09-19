// Agent Durable Object — manages per-agent state, trust history, events, and investigation context.
// Each agent instance is keyed by its agent_key (e.g., "commander-01").
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
    return new Response(JSON.stringify({
      agentKey: this.agentKey,
      state,
      eventsCount: events.length,
      trustHistory: trust.slice(-10),
      updatedAt: await this.storage.get('agent-state-updated'),
    }), { headers: { 'content-type': 'application/json' } });
  }
}
