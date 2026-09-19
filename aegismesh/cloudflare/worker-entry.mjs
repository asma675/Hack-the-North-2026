import { handleApi } from '../server/app.mjs';
import { setCFEnv } from './kv-store.mjs';
import { AegisOrchestrator, runAgent } from './agent-orchestrator.mjs';

export default {
  async fetch(request, env, ctx) {
    setCFEnv(env);

    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      const { integrationStatus } = await import('../server/integrations.mjs');
      return new Response(JSON.stringify({ ok: true, name: 'AegisMesh API', time: new Date().toISOString(), integrations: integrationStatus(), runtime: 'cloudflare-workers' }), {
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

    // Autonomous agent endpoint — the "brain"
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
              headers: {
                'content-type': 'text/event-stream',
                'cache-control': 'no-cache',
                'connection': 'keep-alive',
              },
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
