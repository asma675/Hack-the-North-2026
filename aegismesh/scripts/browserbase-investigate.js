// Vanguard — Browserbase live investigation demo.
// Run: BROWSERBASE_API_KEY=your_key node scripts/browserbase-investigate.js
import { Browserbase } from '@browserbasehq/sdk';

const TARGETS = [
  { url: 'https://www.cisa.gov/catalog', task: 'List the top 5 current security vulnerabilities and their CVE identifiers' },
  { url: 'https://www.crowdstrike.com/trust-center/', task: 'Extract SOC 2 compliance status and any public security disclosures' },
  { url: 'https://www.cloudflare.com/trust-center/', task: 'Check for security certifications, SOC 2 status, and recent disclosures' },
  { url: 'https://nvd.nist.gov/', task: 'Find the most critical CVE published this week with CVSS score' },
];

async function main() {
  if (!process.env.BROWSERBASE_API_KEY) {
    console.error('❌ Set BROWSERBASE_API_KEY first');
    console.log('Sign up at https://browserbase.com and export your key:');
    console.log('  export BROWSERBASE_API_KEY="your_key"');
    process.exit(1);
  }

  const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });

  console.log('🛡️ Vanguard — Browserbase Threat Intel Investigation\n');
  console.log(`📡 ${TARGETS.length} external targets queued for Browserbase verification\n`);

  const results = [];
  for (const target of TARGETS) {
    console.log(`🔍 Investigating: ${target.url}`);
    const start = Date.now();

    try {
      const run = await bb.agents.runs.create({
        task: `Navigate to ${target.url}. ${target.task}`,
        // Verified browser mode requires a Browserbase Enterprise plan.
        browserSettings: { solveCaptchas: true, verified: false },
        resultSchema: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            findings: { type: 'array', items: { type: 'string' } },
            threats: { type: 'array', items: { type: 'string' } },
            soc2Status: { type: 'string' },
            disclosures: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      console.log(`   Run ID: ${run.runId} · Status: ${run.status}`);

      let status = run.status;
      let attempts = 0;
      while (status === 'pending' || status === 'running') {
        if (attempts > 24) { status = 'TIMEOUT'; break; }
        await new Promise(r => setTimeout(r, 5000));
        attempts++;
        const poll = await bb.agents.runs.retrieve(run.runId);
        status = poll.status;
        process.stdout.write(`   Polling... (${attempts}) ${status}\r`);
      }

      const elapsed = Date.now() - start;
      const result = await bb.agents.runs.retrieve(run.runId);
      console.log(`   ✅ Completed in ${(elapsed / 1000).toFixed(1)}s — ${status}`);

      if (result.result) {
        const r = result.result;
        if (r.findings?.length) console.log(`   Findings:`);
        r.findings?.forEach(f => console.log(`     • ${f}`));
        if (r.threats?.length) console.log(`   Threats:`);
        r.threats?.forEach(t => console.log(`     ⚠ ${t}`));
        if (r.soc2Status) console.log(`   SOC 2: ${r.soc2Status}`);
      }
      console.log();

      results.push({ url: target.url, task: target.task, status, elapsed: elapsed / 1000, runId: run.runId, result: result.result });
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}\n`);
      results.push({ url: target.url, error: e.message });
    }
  }

  console.log('━'.repeat(55));
  console.log('📊 INVESTIGATION SUMMARY');
  console.log('━'.repeat(55));
  for (const r of results) {
    const badge = r.status === 'completed' ? '✅' : r.status === 'TIMEOUT' ? '⏰' : '❌';
    console.log(` ${badge} ${r.url}`);
    console.log(`   Run: ${r.runId || '—'} · ${r.elapsed || '?'}s · ${r.status}`);
    if (r.result?.findings?.length) {
      console.log(`   Key findings: ${r.result.findings.slice(0, 2).join('; ')}`);
    }
  }

  console.log('\n🛡️ Investigation complete.');
  console.log('   Verifier agent will synthesize findings into verdict.');
}

main();
