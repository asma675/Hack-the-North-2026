# Vanguard security notes

Vanguard is a hackathon prototype of a zero-trust agent control plane. It is not a production security appliance.

- Never expose model/provider secrets in `VITE_*` variables or browser code.
- Change `AUTH_SECRET` and `EDGE_SHARED_SECRET` before any public deployment.
- The relay demo must switch **low-voltage demo power only**. Never connect mains voltage.
- Production integrations should use hardened identity, mTLS/OAuth, secrets management, rate limiting, tamper-resistant audit storage, and organization-specific authorization policy.
- Signed capabilities are target-specific, action-specific, short-lived, and one-time at the Edge service.
- The demo deliberately includes a prompt-injection/poisoned-agent scenario. This proves that authorization can hold even when reasoning fails; it does not claim universal prompt-injection detection.
