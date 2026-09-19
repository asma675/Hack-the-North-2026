// A2A (Agent-to-Agent) Communication Protocol Durable Object.
// Enables direct agent communication without routing through the orchestrator.
// Each instance is keyed by a conversation ID (e.g., "conv:commander-01+security-02").
export class A2AConversationDO {
  constructor(initializedState) {
    this.storage = initializedState.storage;
    this.convId = initializedState.id;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || request.headers.get('x-action');

    switch (action) {
      case 'sendMessage': return this.sendMessage(request);
      case 'getMessages': return this.getMessages(request);
      case 'getHistory': return this.getHistory(request);
      case 'broadcast': return this.broadcast(request);
      case 'join': return this.joinConversation(request);
      case 'listParticipants': return this.listParticipants(request);
      default: return new Response(JSON.stringify({ error: 'unknown action' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }
  }

  async sendMessage(request) {
    const body = await request.json();
    const { from, to, content, type = 'text', metadata } = body;
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from,
      to,
      content,
      type,
      timestamp: Date.now(),
      read: false,
      ...(metadata && { metadata }),
    };

    const messagesRaw = await this.storage.get('messages') || '[]';
    const messages = JSON.parse(messagesRaw);
    messages.push(message);
    if (messages.length > 500) messages.splice(0, messages.length - 500);
    await this.storage.put('messages', JSON.stringify(messages));

    // Store per-agent inbox
    if (to) {
      const inboxRaw = await this.storage.get(`inbox:${to}`) || '[]';
      const inbox = JSON.parse(inboxRaw);
      inbox.push(message.id);
      if (inbox.length > 100) inbox.splice(0, inbox.length - 100);
      await this.storage.put(`inbox:${to}`, JSON.stringify(inbox));
    }

    return new Response(JSON.stringify({ ok: true, message }), { headers: { 'content-type': 'application/json' } });
  }

  async getMessages(request) {
    const url = new URL(request.url);
    const agentId = url.searchParams.get('agent') || '';
    const limit = Number(url.searchParams.get('limit') || 50);
    const raw = await this.storage.get('messages') || '[]';
    const messages = JSON.parse(raw).filter(m => m.from === agentId || m.to === agentId).slice(-limit);
    return new Response(JSON.stringify(messages), { headers: { 'content-type': 'application/json' } });
  }

  async getHistory(request) {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || 100);
    const raw = await this.storage.get('messages') || '[]';
    const messages = JSON.parse(raw).slice(-limit);
    const participants = JSON.parse(await this.storage.get('participants') || '[]');
    return new Response(JSON.stringify({ messages, participants, conversationId: this.convId }), { headers: { 'content-type': 'application/json' } });
  }

  async broadcast(request) {
    const body = await request.json();
    const { from, content, type = 'announcement' } = body;
    const participantsRaw = await this.storage.get('participants') || '[]';
    const participants = JSON.parse(participantsRaw);
    const results = [];
    for (const participant of participants) {
      if (participant === from) continue;
      await this.sendMessage(new Request('https://internal/sendMessage?action=sendMessage', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from, to: participant, content, type }),
      }));
      results.push({ to: participant, delivered: true });
    }
    return new Response(JSON.stringify({ ok: true, deliveredTo: results.length, recipients: participants }), { headers: { 'content-type': 'application/json' } });
  }

  async joinConversation(request) {
    const body = await request.json();
    const { agentId, role } = body;
    const participantsRaw = await this.storage.get('participants') || '[]';
    const participants = JSON.parse(participantsRaw);
    if (!participants.includes(agentId)) {
      participants.push(agentId);
      await this.storage.put('participants', JSON.stringify(participants));
    }
    await this.storage.put(`role:${agentId}`, JSON.stringify({ role, joinedAt: Date.now() }));
    return new Response(JSON.stringify({ ok: true, participants }), { headers: { 'content-type': 'application/json' } });
  }

  async listParticipants(request) {
    const participants = JSON.parse(await this.storage.get('participants') || '[]');
    const roles = {};
    for (const p of participants) {
      const roleRaw = await this.storage.get(`role:${p}`);
      if (roleRaw) roles[p] = JSON.parse(roleRaw).role;
    }
    return new Response(JSON.stringify({ participants, roles }), { headers: { 'content-type': 'application/json' } });
  }
}

// Utility: get or create a conversation between two agents
export function getConversationId(agentA, agentB) {
  return `conv:${[agentA, agentB].sort().join('+')}`;
}
