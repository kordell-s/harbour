# Government team and e-pay demo implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Let Customs and Immigration stakeholders inspect the information used for review, with a connected fictional government e-pay experience.

**Architecture:** Extend the existing session-only vanilla JS app with a focused government.js module loaded before app.js. Reuse submitted visits, process decisions, document requests, assessments, linked receipts and activity. Add versioned private person-review records and payment attempts; retain existing issuance gates.

**Tech stack:** HTML, CSS, vanilla JavaScript; Node test runner and browser checks. No new production dependencies.

**Spec:** User-approved scope in chat on 16 October 2026: dedicated Customs desk, Immigration desk including captured passport data, and demo government e-pay. Views must open populated and explain available information; presentation does not depend on officers completing a workflow.

## Constraints
- Preserve existing coastal/teal design and broker-led preparation.
- Fictional data only, in memory. No live payment integration, card collection, passport upload or authentication claims.
- Public verification must omit identities, private reviews and receipts.
- Team actions validate department scope; this is simulation, not access control.
- Payment success creates unverified evidence; authority verification and issuance remain separate.
- Do not silently publish changes during implementation. Provide local review first.

## Review focus
- Drafts and superseded submissions must not appear as current authority records.
- Stale requests and repeat payments must not produce extra receipts or issue documents.
- Person reviews bind to submitted version and identity, not mutable draft details.
- Missing/expired passport data is visible without inventing legal eligibility decisions.
- Long values, narrow screens and zero results remain usable.

## Tasks
- [x] Add meaningful failing tests for department scope, private versioned manifest reviews, payment retry/idempotence/staleness and privacy.
- [x] Implement government state helpers and a dedicated fictional assessed visit fixture.
- [x] Build departmental queues, Customs visit file, Immigration manifest/person review and team-scoped outcome controls.
- [x] Build e-pay assessment list, simulation, receipt and transaction history using linked receipt evidence.
- [x] Extend broker passport capture/review and connect navigation, receipt panels and document desks.
- [x] Run workflow suite and browser-check desktop, tablet and mobile layouts plus connected journeys.
- [x] Update handoff and demonstration guide with routes, limitations and verification evidence.

## Verification record

46 tests passed. Independent review completed; fresh-visit initialization regression fixed with a failing-then-passing test. Superseded receipt verification is no longer offered; downloaded receipts reflect current verification. Browser checked 18 route/width combinations and the connected payment/reconciliation journey. No new production dependencies. Local implementation only.
