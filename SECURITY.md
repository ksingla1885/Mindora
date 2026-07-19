# Security Policy & Architecture Guidelines

This document outlines the security policies for the **Mindora** platform, details the vulnerability reporting process, and summarizes the core security architectures implemented to protect the application.

---

## 1. Security Policy

### Supported Versions
Only the latest release/deployment of the Mindora application is officially supported with security updates.

| Version | Supported |
| :--- | :---: |
| Active Deployment (Vercel) |  ✅ Yes |
| All Past Tags / Releases | ❌ No |

### Reporting a Vulnerability
We welcome responsible disclosures from security researchers and administrators. If you discover a vulnerability, please do not disclose it publicly or file a public GitHub issue. Instead, follow these steps:
1. Email your findings directly to the administrative security team (refer to contact info in `.env` or system configurations).
2. Include a detailed description of the vulnerability, step-by-step instructions to reproduce it ethically, and any potential remediation recommendations.
3. The security team will acknowledge your report within **48 hours** and coordinate a patch within a reasonable timeline.

---

## 2. Hardened Security Architecture

The following defensive layers have been established and audited against the OWASP Top 10 framework:

### A01:2021 – Broken Access Control
* **Test Question Protection**: 
  - Access to question lists (`/api/tests/[testId]` and `/api/tests/[testId]/questions`) is gated by authorization checks. Paid tests require valid payment tokens inside the database before question data is exposed.
  - Standard users (role: `STUDENT`) are stripped of `correctAnswer` and `explanation` attributes in API responses to prevent client-side answer disclosure/cheating.
* **WebSocket Handshake Validation**:
  - Connections to the WebSocket server (`socket-server.js`) must submit valid NextAuth session cookies (`next-auth.session-token` or `__Secure-next-auth.session-token`). Handshakes lacking verified JWT claims are terminated.
  - Test room subscription (`join-test`) is restricted. A user can only subscribe to a room matching their authenticated `userId` or `sub` claim. Admins and teachers retain global viewing privileges.

### A03:2021 – Injection
* **Prisma ORM Protection**:
  - SQL injection is mitigated by default through parameterized database queries provided by the Prisma client.
* **AI Prompt Injection Shielding**:
  - The Groq AI chat endpoint (`/api/ai/chat`) sanitizes incoming payloads by discarding any objects using the `system` role or other non-standard roles. Only client messages containing `user` or `assistant` roles are propagated to the model.

### A05:2021 – Security Misconfiguration
* **Timing-Safe Webhook Handling**:
  - Razorpay webhook verification checks signature header presence and length alignment before executing cryptographic comparisons (`crypto.timingSafeEqual`). This prevents runtime type errors and potential denial of service crashes.
* **HTTP Security Headers**:
  - Security headers are applied at the network edge via Vercel middleware and configuration rules:
    - `Strict-Transport-Security` (HTTPS enforcement)
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY` (Clickjacking prevention)
    - `Content-Security-Policy` with runtime dynamic script nonces.

---

## 3. Best Practices for Deployment

1. **Environment Secrets**: Ensure `AUTH_SECRET`, `CRON_SECRET`, and payment webhook secrets are generated using high-entropy random byte generators (e.g., `openssl rand -base64 32`) and are **never** committed to version control.
2. **Database Gating**: Set up strong access controls on the PostgreSQL direct connection string. Ensure PgBouncer connection limits are respected.
3. **Rate Limiting**: sliding window rate limiting is backed by Upstash Redis to prevent distributed credential stuffing or token exhaustion attacks. Monitor Redis logs periodically to adapt limits.
