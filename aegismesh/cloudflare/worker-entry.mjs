import { handleApi } from '../server/app.mjs';
import { setCFEnv } from './kv-store.mjs';
import { AegisOrchestrator, runAgent, streamAgent } from './agent-orchestrator.mjs';

export default {
  async fetch(request, env, ctx) {
    setCFEnv(env);

    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      const { integrationStatus } = await import('../server/integrations.mjs');
      return new Response(JSON.stringify({ ok: true, name: 'Vanguard API', time: new Date().toISOString(), integrations: integrationStatus(), runtime: 'cloudflare-workers' }), {
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      });
    }

    if (url.pathname === '/api/queue/send' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (env.AEGIS_QUEUE) {
        await env.AEGIS_QUEUE.send(body);
        return new Response(JSON.stringify({ ok: true, queued: true }), { headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({ ok: true, queued: false, reason: 'no queue binding' }), { headers: { 'content-type': 'application/json' } });
    }

    if (url.pathname === '/api/agent/run' && request.method === 'POST') {
      return new Promise(async (resolve) => {
        try {
          const body = await request.json().catch(() => ({}));
          const message = body.message || body.goal || 'Investigate the current incident';

          if (body.stream) {
            const orchestrator = new AegisOrchestrator(env);
            const stream = new TransformStream({
              async transform(chunk, controller) {
                controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
              },
              flush(controller) { controller.close(); },
            });
            const writer = stream.writable.getWriter();
            (async () => {
              for await (const chunk of orchestrator.run(message, { signal: AbortSignal.timeout(120000) })) {
                await writer.write(chunk);
              }
              await writer.close();
            })();
            return new Response(stream.readable, {
              headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', 'connection': 'keep-alive' },
            });
          }

          const orchestrator = new AegisOrchestrator(env);
          const result = await orchestrator.run(message, { signal: AbortSignal.timeout(120000) });
          resolve(new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } }));
        } catch (err) {
          console.error('[Agent]', err);
          resolve(new Response(JSON.stringify({ error: err.message, steps: [] }), { status: 500, headers: { 'content-type': 'application/json' } }));
        }
      });
    }

    // A2A protocol endpoint — direct agent-to-agent messaging
    if (url.pathname.match(/^\/api\/a2a\/.*/) && request.method === 'POST') {
      const m = url.pathname.match(/^\/api\/a2a\/(.+)$/);
      if (m && env.AEGIS_AGENT_DO) {
        const convId = `conv:${m[1]}`;
        const conv = env.AEGIS_AGENT_DO.get(convId);
        const doRes = await conv.fetch(new Request(`https://internal/sendMessage?action=sendMessage`, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: request.body,
        }));
        const text = await doRes.text();
        return new Response(text, { status: doRes.status, headers: { 'content-type': 'application/json' } });
      }
      if (m && env.AEGIS_GATE_DO) {
        const gate = env.AEGIS_GATE_DO.get(m[1]);
        const doRes = await gate.fetch(request);
        const text = await doRes.text();
        return new Response(text, { status: doRes.status, headers: { 'content-type': 'application/json' } });
      }
    }

    if (url.pathname === '/api/agent/stream' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const message = body.message || body.goal || 'Investigate';
      const orchestrator = new AegisOrchestrator(env);
      return new Response(new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of orchestrator.run(message, { signal: AbortSignal.timeout(120000) })) {
              controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
            }
            controller.close();
          } catch (err) {
            controller.enqueue(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
            controller.close();
          }
        },
        cancel() {},
      }), {
        headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', 'connection': 'keep-alive' },
      });
    }

    let parsedBody = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try { parsedBody = await request.json(); } catch { parsedBody = null; }
    }

    return new Promise((resolve) => {
      let resBody = null;
      let resStatus = 200;
      const resHeaders = {};

      const req = { url: request.url, method: request.method, headers: request.headers, body: parsedBody };

      const res = {
        get statusCode() { return resStatus; },
        set statusCode(s) { resStatus = s; },
        setHeader: (k, v) => { resHeaders[k] = v; return res; },
        end: (data) => { resBody = data; },
      };

      handleApi(req, res).then(() => {
        resolve(new Response(resBody || '{}', {
          status: resStatus,
          headers: { 'content-type': resHeaders['Content-Type'] || 'application/json', 'cache-control': 'no-store' },
        }));
      }).catch(err => {
        console.error('[Worker]', err);
        resolve(new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
          status: err.status || 500,
          headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
        }));
      });
    });
  },
};
