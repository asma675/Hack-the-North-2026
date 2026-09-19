# AegisMesh standalone full-stack release

This release is built from the supplied Base44 export and preserves the original AegisMesh UI/mascot experience while replacing the Base44 runtime with an independent backend.

## Major additions

- Own Node API + Vercel entrypoint
- Docker deployment
- B2B landing page + waitlist
- dark/light mode and hard-edge glow styling
- Huawei openJiuwen A2A adapter
- OpenAI Evidence Court adapter
- optional Cloudflare Aegis Gate Worker
- signed one-time execution capabilities
- Raspberry Pi Aegis Edge service
- live/simulated integration truth labels
- one-click judge session
- local auth / registration / reset support
- release and provider contract smoke tests

## Release validation

Passed before packaging:

- 113 frontend source files parsed successfully
- Node backend syntax checks
- full backend smoke test
- mocked LIVE Huawei/OpenAI/Cloudflare provider-contract test
- Cloudflare gate allow/block logic test
- Aegis Edge status/test/signature/replay test
- package/lock root consistency check
- secret scan
- Base44 runtime import scan

The release environment could not fetch npm packages from `registry.npmjs.org`, so a Vite production bundle was not generated inside the sandbox. `package.json` and `package-lock.json` are included; run `npm ci && npm run build` in a normal networked environment or let Vercel/Docker perform the install/build.
