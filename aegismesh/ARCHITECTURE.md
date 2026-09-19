# AegisMesh architecture

```text
Huawei openJiuwen / WorkSwarm
    multi-agent investigation
              |
              v
OpenAI Evidence Court
    evidence adjudication
    counterfactual analysis
    least-destructive response
              |
              v
Aegis Gate
    identity + policy + confidence + risk
              |
              v
Human dual control (NFC for high risk)
              |
              v
Signed one-time execution capability
              |
              v
Aegis Edge enforcement Pi
              |
              v
Victim/demo infrastructure
```

The React UI is the presentation/control plane. The Node backend is provider-neutral and replaces the original Base44 runtime. It implements authentication, durable entity APIs, waitlist capture, policy enforcement, sponsor adapters, audit persistence, and signed execution capabilities.

Local persistence uses `data/aegismesh.json`. Vercel deployments can set Upstash Redis REST environment variables for durable persistence across serverless invocations.
