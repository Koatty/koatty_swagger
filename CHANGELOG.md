## Unreleased — Phase A–F review (2026-09-30)

## 4.0.0

### Patch Changes

- f0e9278: Close the second Phase A–F review: strict security config validation and environment resolution, explicit metrics trust, default WS Origin checks, hard-link-safe CLI writes and delimited tool arguments, DTO transformation and conservative schema diagnostics, privacy-safe telemetry, HTTP3 peer ownership and draining reference SSE service. MCP/LLM/Guard first-release major entries are in phase-f-audit-hardening. See docs/migration/phase-a-f-review-fixes.md. Do not treat local tests as release/client/provider acceptance.
- Updated dependencies [f0e9278]
- Updated dependencies [f0e9278]
- Updated dependencies [f0e9278]
  - koatty@5.0.0
  - koatty_lib@1.6.1

Resolve production/default enablement using KOATTY_ENV precedence and the shared security profile resolver at invocation time.

Migration: `docs/migration/phase-a-f-review-fixes.md` in the monorepo. No release has been applied.

# koatty_swagger

## 3.0.0

### Patch Changes

- Updated dependencies
  - koatty@4.4.0

## 2.0.3

### Patch Changes

- koatty@4.3.3

## 2.0.2

### Patch Changes

- koatty@4.3.2

## 2.0.1

### Patch Changes

- koatty@4.3.1

## 2.0.0

### Minor Changes

- Phase B security hardening (koatty-hardening-and-ai-evolution-plan.md, ADR-101/102/103). Fail-closed defaults with a `security.legacyDefaults: true` rollback switch; see docs/migration/4.3.0.md for the full migration guide.

  Highlights:

  - SecurityProfile (strict/standard/development) exposed read-only as `app.security`, with a startup summary and per-item WARN when rolling back
  - body parsing failures return 400/413/415 instead of silently producing `{}`; body size limit follows the security profile (1mb in production)
  - DTO validation whitelist on by default (strict profile rejects unknown fields); `__proto__`/`constructor` keys never reach DTO instances
  - AOP aspect failures abort the business method unless opted out via `{ onError: 'log' }` or `app.security.aop.onAspectError`
  - After/AfterEach aspects receive the business result via `options.result`
  - GraphQL: profile-driven playground/introspection/depth limits, built-in depth rule, optional complexity package fails startup when configured but missing, CDN-free GraphiQL
  - uploads: profile-driven maxFiles/maxFields/maxFieldsSize, keepExtensions defaults off, array-aware temp cleanup, new `safeFilename` export
  - ops endpoints: minimal liveness body, /ready 503 while draining, /metrics behind the exposeMetrics policy (loopback/RFC1918/allowCidrs/token), Prometheus bound to 127.0.0.1, rateLimit middleware wired (default off)
  - request IDs validated (`[A-Za-z0-9._:-]{1,128}`), query fallback disabled, structured access logs, topology service header opt-in
  - WebSocket: profile maxPayload, perMessageDeflate off, Origin check, connection limits, error-message redaction, slow-consumer guard, timer cleanup on destroy
  - TLS minVersion TLSv1.2 by default; TypeORM production logs errors only with sensitive-parameter redaction; Swagger disabled in production by default
  - defect fixes: escapeHtml (&-escaping, valid entities), ReDoS-safe isNumberString, plugin run() executes once, bootstrap failures propagate, Redis default port 6379, gRPC ListServices, koatty_cli bin (CJS build), RedLocker.resetInstance, config() write loss, CLI sandbox + `apply` dry-run by default

### Patch Changes

- Updated dependencies
  - koatty@4.3.0
  - koatty_lib@1.6.0

## 1.1.0

### Minor Changes

- build
- build

### Patch Changes

- Updated dependencies
- Updated dependencies
  - koatty@4.2.0
  - koatty_lib@1.5.0

## 1.0.1

### Patch Changes

- build
- Updated dependencies
  - koatty@4.1.15
  - koatty_lib@1.4.9
