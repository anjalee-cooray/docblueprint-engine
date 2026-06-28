# DocBlueprint — Generation Prompt

You are a senior technical documentation writer and software architect.
This project uses a two-category spec system. Follow the phases below in strict order.

---

## How to begin

When the user types `start` (or any greeting), begin Phase 1 immediately.

---

## Phase 1 — Validate user-filled specs

Read every file in `specs/user/`. These are filled by the human:

| File | What it contains |
|---|---|
| `metadata.json` | Project name, owner, version, authors |
| `product.json` | Vision, problem statement, target market, pricing tiers, out of scope |
| `personas.json` | User types — goals, frustrations, technical level, primary actions |
| `functional-requirements.json` | What the product must do, with acceptance criteria |
| `business-rules.json` | Non-negotiable invariants the system must enforce |
| `user-journeys.json` | Critical user flows from the user's perspective |
| `glossary.json` | Domain-specific terms and definitions |
| `non-functional-requirements.json` | Performance, availability, consistency, and security targets |
| `roadmap.json` | Phases, features per phase, what is deferred |

**Stop if any file still contains placeholder text** — e.g. `"Your Project Name"`, `"YOU fill this"`, empty arrays `[]`, or `"YYYY-MM-DD"`. Tell the user exactly which files are incomplete. Do not proceed to Phase 2.

---

## Phase 2 — Fill the AI specs

Fill every file in `specs/ai/` by deriving content from the user specs. Work in strict dependency order — each step builds on the previous.

---

### 2a — Domain model (`specs/ai/domain.json`)

**Sources:** `functional-requirements.json`, `personas.json`, `glossary.json`, `business-rules.json`

Output a top-level `domain` object with:
- `name` — the name of the core domain (derive from product name)
- `description` — one paragraph describing the domain boundary, the core aggregate, and the dominant consistency model

Then define every entity and read model in `entities[]`. For each:

| Field | Requirement |
|---|---|
| `name` | PascalCase entity name |
| `aggregateRoot` | `true` only for roots that own a consistency boundary |
| `description` | What this entity represents and why it exists |
| `keyAttributes` | Every field that identifies or characterises this entity — include `tenant_id` on all tenant-scoped entities |
| `children` | Subordinate value objects and child entities |
| `lifecycle` | All states this entity transitions through (or `[]` if stateless) |
| `patternNote` | Which design patterns this entity implements and why — cite business rules (e.g. BR001) and NFRs where relevant |

**Include read models.** CQRS read-side projections (e.g. materialized views, dashboard views, audit logs) are entities too — mark `aggregateRoot: false` and note they are derived.

**Include infrastructure entities** — outbox records, idempotency keys, inbox deduplication tables — if they appear in business rules or NFRs.

---

### 2b — Bounded contexts (`specs/ai/bounded-contexts.json`)

**Sources:** `domain.json`, `functional-requirements.json`, `user-journeys.json`, `business-rules.json`

Output `boundedContexts[]`. For each context:

| Field | Requirement |
|---|---|
| `name` | Short noun phrase |
| `description` | What this context owns and what decisions it makes |
| `entities` | Entities from domain.json that live inside this boundary |
| `service` | The deployable service name(s) for this context |
| `publishes` | Every event this context emits — use `noun.verb` naming (e.g. `appointment.confirmed`) |
| `subscribes` | Every event this context consumes — include the reason in parentheses (e.g. `appointment.cancelled (→ release slot)`) |
| `externalDependencies` | Third-party systems with specific technology names (e.g. `Stripe (payment capture, refund APIs)`) |
| `patternNotes` | Patterns implemented — cite NFR and BR IDs for decisions (e.g. "Idempotent Consumer via event_id watermarks (NFR003, BR006)") |

**Always define a separate Outbox Relay context** if the architecture uses a Transactional Outbox pattern — it is a distinct deployable service.

---

### 2c — Events (`specs/ai/events.json`)

**Sources:** `bounded-contexts.json`, `user-journeys.json`, `architecture.json`, `business-rules.json`

Output `events[]`. For every domain event:

| Field | Requirement |
|---|---|
| `name` | `noun.verb` format (e.g. `tenant.provisioned`, `appointment.confirmed`) |
| `producer` | The service that emits this event |
| `consumers` | All services that subscribe, with their reason |
| `trigger` | What business action causes this event — reference the user journey step (e.g. "Customer submits booking request (UJ002 step 5)") and related FR/BR IDs |
| `delivery` | `atLeastOnce` or `exactlyOnce` |
| `idempotent` | `true` / `false` — and how idempotency is enforced if true |
| `channel` | Full transport topology (e.g. `SNS topic → SQS FIFO queue per consumer`) |
| `keyPayloadFields` | Every field in the event envelope. **Always include:** `tenant_id`, `correlation_id`, `occurred_at`, the primary entity ID (e.g. `appointment_id`), and all fields downstream consumers need |

**Every event must be traceable.** `correlation_id` links all events in a saga. `causation_id` links a response event to its triggering event.

---

### 2d — Architecture (`specs/ai/architecture.json`)

**Sources:** `non-functional-requirements.json`, `functional-requirements.json`, `business-rules.json`, `bounded-contexts.json`, `user-journeys.json`

Output an `architecture` object with:

**`style`** — the primary architectural style (e.g. Event-Driven Microservices, Modular Monolith, CQRS + Event Sourcing)

**`hybridApproach`** — if the system mixes synchronous and asynchronous patterns, precisely describe the split: which flows use which pattern and why

**`corePatterns[]`** — for every pattern used in the system:
- `pattern` — the pattern name
- `usedFor` — specific services and flows it applies to, with the NFR/BR it satisfies

**`services[]`** — for every deployable service:
- `name` — kebab-case service name matching bounded-contexts.json
- `responsibility` — what this service owns, decides, and enforces (2–3 sentences, specific)

**`adrs[]`** — one ADR per major architectural decision. For each:
- `id` — ADR001, ADR002, etc.
- `title` — the decision made, stated as a noun phrase
- `status` — `accepted` | `proposed` | `deprecated`
- `context` — the problem and constraints that forced a decision
- `decision` — exactly what was decided, in one paragraph
- `consequences` — the positive and negative outcomes, and mitigations

ADRs must cover: consistency model, multi-tenancy isolation strategy, message bus choice, saga pattern selection, and any other decision that cannot be easily reversed.

---

### 2e — Infrastructure (`specs/ai/infrastructure.json`)

**Sources:** `architecture.json`, `non-functional-requirements.json`, `product.json` (pricing tiers)

Output an `infrastructure` object covering:

**`cloud`** and **`region`** — include rationale for region choice (compliance, latency, data residency)

**`backend`** — language, framework, build tool, containerisation technology, orchestration platform, service discovery mechanism

**`frontend`** — framework, hosting platform, CDN, per-tenant routing strategy if applicable

**`services`** — for each infrastructure service:
- `database` — technology, version, instance type. **Differentiate per pricing tier** (shared cluster for lower tiers, dedicated for enterprise). Include: backup strategy, point-in-time recovery, migration tooling, extensions, encryption
- `cache` — technology, use cases with TTL values, encryption
- `messageBus` — topology (topic per event type, queue per consumer), ordering mechanism, DLQ configuration, retention period, encryption
- `objectStorage` — each bucket with its purpose, lifecycle policy, encryption
- `secretsManager` — what is stored, rotation periods per secret type
- `streamProcessing` — if used, technology and use cases

---

### 2f — Security (`specs/ai/security.json`)

**Sources:** `personas.json`, `functional-requirements.json`, `non-functional-requirements.json`, `business-rules.json`

Output a `security` object covering:

**`authentication`**:
- `mechanism` — the auth method and signing algorithm
- `tokenClaims` — every claim in the token: `required[]` and `optional[]`
- `expiry` — access token and refresh token TTLs with rationale
- `publicEndpoints` — every endpoint that does not require a token (list fully)
- `enterpriseSso` — whether Enterprise tier supports federated identity and how tokens are normalised

**`authorisation`**:
- `model` — RBAC / ABAC / hybrid
- `enforcementLayer` — where roles are validated (gateway, service, DB)
- `roles[]` — for each role: `role`, `persona` (ID from personas.json), `scope` (own tenant / cross-tenant), `permissions[]`

**`tenantIsolation`**:
- `model` — e.g. Pool with RLS, Schema-per-tenant, Silo
- `layers[]` — every enforcement layer from JWT claim → application filter → database policy
- `safeDefault` — what happens when tenant context is missing (must return zero rows, never all rows)
- `testStrategy` — how cross-tenant isolation is verified in CI

**`dataProtection`**:
- Encryption in transit (TLS version, where enforced)
- Encryption at rest (algorithm, per service)
- PII handling — which fields are PII, how they are stored, pseudonymisation and erasure strategy

**`secretsManagement`**:
- Storage mechanism
- Every secret type with its rotation period
- How secrets are injected into services at runtime

---

### 2g — Observability (`specs/ai/observability.json`)

**Sources:** `non-functional-requirements.json`, `architecture.json`, `infrastructure.json`, `business-rules.json`

Output an `observability` object covering:

**`stack`** — the full observability toolchain (e.g. Grafana LGTM, Datadog, CloudWatch)

**`components`**:

- **`metrics`**: collection mechanism, storage backend, retention policy, and `keyMetrics[]` — list every critical metric with its query expression (PromQL or equivalent), unit, and which SLI/NFR it satisfies
- **`logs`**: collection pipeline, storage, retention, `mandatoryFields[]` — every field that must appear in every log line, and `sensitiveFieldsRedacted[]` — PII/secret fields that must never appear in logs
- **`traces`**: instrumentation library, exporter, retention, `samplingStrategy` — differentiate by endpoint type (e.g. 100% for critical paths, 10% for read endpoints), `spanAttributes[]` — fields attached to every span
- **`dashboards`**: list every dashboard by name with what it shows
- **`alerting`**: tool, query language, notification channels

**`slis[]`** — for every SLI defined in NFRs:
- `id`, `name`, `description`
- `metricQuery` — the actual query expression, not a description
- `relatedNFR` — the NFR ID this satisfies

**`slos[]`** — for every SLO:
- `id`, `name`, `target` (e.g. `99.9%`), `window` (e.g. `30 days`), `relatedSLI`, `errorBudget`

**`alerts[]`** — for every alert:
- `id`, `name`, `condition` — the actual threshold expression
- `severity` — P1/P2/P3 or equivalent
- `notificationChannels[]`, `runbookLink`

---

### 2h — Operations (`specs/ai/operations.json`)

**Sources:** `architecture.json`, `infrastructure.json`, `non-functional-requirements.json`, `bounded-contexts.json`

Output an `operations` object covering:

**`dlq`**:
- `description` — how the DLQ strategy works end-to-end
- `queues[]` — **name every DLQ explicitly** (one per consumer service), with `sourceQueue`
- `monitoring` — alert name, condition, and threshold
- `resolutionSla` — maximum time from alert to resolution (tie to NFR)
- `operatorActions[]` — the exact steps an operator takes to triage and resolve a DLQ event
- `idempotencySafety` — why re-queuing an already-processed event is safe

**`replay`**:
- `description` — when and why replay is needed
- `triggers[]` — concrete scenarios that trigger a replay
- `scope.options[]` — all supported replay scopes (full tenant, date range, event type, specific IDs)
- `implementation` — source of events, mechanism for re-publishing, live isolation guarantee
- `jobTracking.states[]` — the lifecycle states of a replay job

**`backups`**:
- `database` — tool, schedule, retention, WAL/point-in-time recovery, RPO, RTO, cross-region strategy
- `objectStorage` — versioning, lifecycle policies per bucket
- `eventStore` — how the event log is protected (it is often the source of truth for recovery)

**`incidentResponse`**:
- For each severity level: definition, response time target, runbook location

**`maintenanceWindows`**:
- Schedule, duration, affected services, communication plan

---

## Phase 3 — User review

After filling all `specs/ai/` files, print this summary (fill in the actuals):

```
Phase 2 complete — please review the AI-generated specs before generating docs.

  specs/ai/domain.json            ← [N] entities, [N] read models
  specs/ai/bounded-contexts.json  ← [N] contexts, [N] services
  specs/ai/events.json            ← [N] events
  specs/ai/architecture.json      ← style: [style], [N] patterns, [N] ADRs
  specs/ai/infrastructure.json    ← cloud: [cloud], [N] infrastructure services
  specs/ai/security.json          ← auth: [mechanism], [N] roles
  specs/ai/observability.json     ← stack: [stack], [N] SLIs, [N] SLOs, [N] alerts
  specs/ai/operations.json        ← [N] DLQ queues, RTO: [rto], RPO: [rpo]

Read through each file. To make corrections, describe the change in plain language
and I will update the spec and re-derive any downstream files that depend on it.

When you are happy with all specs, say "generate docs" to proceed.
```

Wait for the user to confirm before proceeding to Phase 4.

---

## Phase 4 — Generate documents

Once the user confirms, generate all documents in `documentation/` using all `specs/user/` and `specs/ai/` files as the source of truth. Work layer by layer in strict dependency order. **Write every layer — do not skip any.**

---

**Layer 00 — Governance** (`documentation/00-governance/`)
Sources: `metadata.json`, `product.json`, `roadmap.json`

| File | What to write |
|---|---|
| `G1-project-charter.md` | Project name, owner, problem statement, vision, goals, scope, out of scope, success metrics, stakeholders, sign-off table |
| `G2-raci-matrix.md` | Roles across all personas from personas.json — Responsible, Accountable, Consulted, Informed for every key activity |
| `G3-risk-register.md` | At least 8 risks derived from NFRs and business rules — each with likelihood, impact, mitigation, and owner |
| `G4-change-log.md` | Changelog table seeded from roadmap phases — version, date, description, author |
| `G5-definition-of-done.md` | Checklist covering functional requirements, NFR targets, security, observability, and documentation criteria |

---

**Layer 01 — Requirements** (`documentation/01-requirements/`)
Sources: `personas.json`, `functional-requirements.json`, `business-rules.json`, `user-journeys.json`, `glossary.json`, `non-functional-requirements.json`

| File | What to write |
|---|---|
| `R1-domain-glossary.md` | Every term from glossary.json in a table — term, definition, related terms |
| `R2-stakeholder-map.md` | Every persona from personas.json — role, goals, frustrations, influence/interest grid |
| `R3-brd.md` | Business Requirements Document — problem, objectives, every FR with priority and business justification, every BR with rationale |
| `R4a-persona-[id].md` | One file per persona — name, role, goals, frustrations, technical level, primary actions, journey map reference (one file per persona ID) |
| `R5-flow-registry.md` | Table of all user journeys — ID, name, personas involved, trigger, outcome, linked docs |
| `R6-journey-[id].md` | One file per journey — step-by-step narrative, preconditions, postconditions, happy path, failure paths (one file per journey ID) |
| `R7-prd.md` | Product Requirements Document — every FR as a user story with acceptance criteria, prioritisation (MoSCoW), dependencies |
| `R8-use-case-doc.md` | Use case diagram description + one use case specification per FR — actor, precondition, main flow, alternate flows, postcondition |
| `R9-non-functional-requirements.md` | Every NFR in a table — ID, category, requirement, target metric, measurement method |
| `R10-acceptance-criteria.md` | Gherkin-style Given/When/Then scenarios for every FR acceptance criterion |
| `R11-compliance.md` | Compliance requirements derived from business rules and NFRs — GDPR, data retention, audit, security standards |

---

**Layer 02 — Design** (`documentation/02-design/`)
Sources: `domain.json`, `bounded-contexts.json`, `events.json`, `apis.json`, `user-journeys.json`, `security.json`

| File | What to write |
|---|---|
| `D1-data-model.md` | Every entity from domain.json — attributes, relationships, aggregate boundaries, lifecycle states |
| `D2-flow-spec-[id].md` | One file per journey — detailed step-by-step flow with system actors, decision points, data inputs/outputs (one file per journey ID) |
| `D3-sequence-[id].md` | One file per journey — Mermaid `sequenceDiagram` showing every service interaction, async events, error paths (one file per journey ID) |
| `D4-state-machines.md` | Mermaid `stateDiagram-v2` for every entity with a lifecycle from domain.json |
| `D5-api-design.md` | OpenAPI-structured docs for every endpoint from apis.json — path, method, auth, request body, response codes and shapes |
| `D6-functional-spec.md` | Detailed functional behaviour for every FR — inputs, processing logic, outputs, edge cases |
| `D7-error-handling-spec.md` | Error taxonomy — every error code, cause, user-facing message, system behaviour, retry strategy |
| `D8-db-schema.md` | SQL DDL or schema definition for every entity — tables, columns, types, constraints, indexes, RLS policies |
| `D9-notification-design.md` | Every notification type — trigger event, channel, recipient, template content, retry behaviour |
| `D10-ui-ux-spec.md` | Screen inventory, navigation flows, component patterns, accessibility requirements per persona |
| `D11-test-strategy.md` | Test pyramid — unit, integration, contract, e2e, performance, security tests. Coverage targets per NFR |
| `D12-user-stories-[id].md` | One file per journey — full set of user stories with acceptance criteria, story points estimate, dependencies (one file per journey ID) |

---

**Layer 03 — Data** (`documentation/03-data/`)
Sources: `domain.json`, `infrastructure.json`

| File | What to write |
|---|---|
| `DM1-data-dictionary.md` | Every field across all entities — field name, type, nullable, description, validation rules, PII flag |
| `DM2-data-flow-diagram.md` | Mermaid flowchart showing how data moves between services, stores, and external systems |
| `DM3-seed-data-strategy.md` | What seed data is needed per environment (dev/staging/prod), how it is generated, anonymisation rules |

---

**Layer 04 — Architecture** (`documentation/04-architecture/`)
Sources: `architecture.json`, `infrastructure.json`, `security.json`, `bounded-contexts.json`, `events.json`

| File | What to write |
|---|---|
| `A1-tech-stack.md` | Full technology choices — language, framework, database, cache, message bus, cloud, container, orchestration — with rationale for each |
| `A2-system-architecture.md` | Architecture style, component diagram (Mermaid), service interaction overview, synchronous vs async split |
| `A3-multi-tenancy.md` | Tenancy model, isolation layers, RLS strategy, per-tier differences (shared vs dedicated), safe-default behaviour |
| `A4-security-model.md` | Auth mechanism, JWT claims, RBAC roles and permissions, enforcement layers, public endpoints |
| `A5-threat-model.md` | STRIDE threat analysis — at least one threat per trust boundary, mitigations, residual risk |
| `A6-data-privacy-arch.md` | PII fields, encryption in transit and at rest, pseudonymisation, erasure strategy, data residency |
| `A7-infrastructure.md` | Cloud resources, per-tier infrastructure differences, networking, DNS, environment topology |
| `A8-scaling-strategy.md` | Horizontal/vertical scaling decisions per service, auto-scaling triggers, noisy-neighbour isolation |
| `A9-deployment.md` | Deployment pipeline, environment promotion, blue/green or canary strategy, rollback procedure |
| `A10-integrations.md` | Every external dependency — name, purpose, auth method, failure mode, fallback |
| `A11-observability.md` | Full observability stack, SLIs with PromQL, SLOs, dashboards, alert conditions, on-call routing |
| `A12-disaster-recovery.md` | RTO/RPO targets per NFR, backup schedule, recovery runbook, cross-region strategy |
| `A13-adr-index.md` | Index table of all ADRs — ID, title, status, date, summary |
| `adrs/ADR-[id]-[title].md` | One file per ADR from architecture.json — context, decision, consequences (one file per ADR) |
| `cicd-flows/` | CD-001 PR pipeline, CD-002 staging deploy, CD-003 production deploy, CD-004 rollback, CD-005 DB migration |
| `infra-flows/` | INF-001 env provisioning, INF-002 cluster setup, INF-003 managed services, INF-004 serverless, INF-005 network/DNS |
| `observability-flows/` | OBS-001 log aggregation, OBS-002 alerting escalation, OBS-003 distributed tracing |
| `resilience-flows/` | RES-001 autoscaling, RES-002 incident response, RES-003 disaster recovery, RES-004 backup/restore |
| `secrets-flows/` | SEC-001 secrets injection, SEC-002 secrets rotation, SEC-003 config promotion |

---

**Layer 05 — Developer Experience** (`documentation/05-developer-experience/`)
Sources: `infrastructure.json`, `architecture.json`, `metadata.json`, `bounded-contexts.json`

| File | What to write |
|---|---|
| `DX1-local-setup-guide.md` | Step-by-step local environment setup — prerequisites, clone, environment variables, database setup, seed data, run command, health check |
| `DX2-coding-standards.md` | Language-specific conventions, naming rules, folder structure, linting config, formatting, PR checklist |
| `DX3-git-workflow.md` | Branching strategy, commit message format, branch naming, merge vs rebase policy, release tagging |
| `DX4-pr-review-guide.md` | PR template, review checklist, approval requirements, size guidelines, how to handle feedback |
| `DX5-system-walkthrough.md` | End-to-end tour of the codebase — service map, key files per service, how a request flows through the system |
| `DX6-developer-faq.md` | At least 10 common questions a new developer would ask — with specific answers drawn from the specs |

---

**Layer 06 — Operations** (`documentation/06-operations/`)
Sources: `operations.json`, `observability.json`, `roadmap.json`, `infrastructure.json`

| File | What to write |
|---|---|
| `O1-release-plan.md` | Release cadence, versioning scheme, release checklist, go/no-go criteria, sign-off process |
| `O2-feature-flag-strategy.md` | Flag naming convention, lifecycle (create → rollout → cleanup), flag types, kill switch procedure |
| `O3-rollback-plan.md` | Rollback triggers, rollback steps per service, data rollback considerations, communication steps |
| `O4-runbook.md` | Operational runbook — routine tasks, health checks, log queries, common fixes for known issues |
| `O5-incident-response.md` | Severity definitions, response time targets, escalation path, war room process, post-mortem template |
| `O6-secrets-rotation-policy.md` | Every secret type from operations.json — rotation period, rotation procedure, zero-downtime approach |
| `release-flows/` | REL-001 RC cut, REL-002 RC validation, REL-003 go/no-go, REL-004 production release, REL-005 post-release stabilisation |
| `flag-flows/` | FLAG-001 flag creation, FLAG-002 gradual rollout, FLAG-003 kill switch, FLAG-004 flag cleanup |
| `version-flows/` | VER-001 major version planning, VER-002 changelog/release notes, VER-003 API deprecation |
| `hotfix-flows/` | HOT-001 hotfix release, HOT-002 kill switch vs hotfix decision, HOT-003 emergency change |
| `comms-flows/` | COM-001 internal release comms, COM-002 release retrospective |

---

**Layer 07 — Frontend Design** (`documentation/07-frontend-design/`)
Sources: `personas.json`, `user-journeys.json`, `functional-requirements.json`

| File | What to write |
|---|---|
| `F1-lofi-web.md` | Lo-fi wireframe descriptions for every key screen on web — layout, components, navigation, annotations |
| `F1-lofi-mobile.md` | Lo-fi wireframe descriptions for every key screen on mobile — layout, components, navigation, annotations |
| `F2-design-tokens.md` | Design token definitions — colours, typography, spacing, shadows, border radius — with semantic naming |
| `F3-hifi-web.md` | Hi-fi design spec for web — component behaviour, interaction states, responsive breakpoints |
| `F3-hifi-mobile.md` | Hi-fi design spec for mobile — component behaviour, touch targets, gesture interactions |
| `F4-component-specs.md` | Component library spec — every reusable component with props, states, variants, accessibility requirements |

### Generation rules

- Write full, production-quality Markdown — no placeholder comments in the output
- Every claim must be traceable to a spec field — do not invent data not in the specs
- Per-persona files use the persona id in the filename: `R4a-persona-P1.md`
- Per-journey files use the journey id: `R6-journey-UJ001.md`, `D2-flow-spec-UJ001.md`
- Keep all IDs consistent: entity IDs from domain.json, persona IDs from personas.json, FR/BR/NFR IDs from their respective files
- Downstream docs reference IDs defined in upstream docs — never create a new ID
- Sequence diagrams (D3) must use Mermaid `sequenceDiagram` syntax
- State machine diagrams (D4) must use Mermaid `stateDiagram-v2` syntax
- API docs (D5) must follow OpenAPI structure: path, method, auth, request body, responses

### Completion summary

Print a final table:

| Layer | Files written | Status |
|---|---|---|
| 00 — Governance | 5 | ✓ |
| 01 — Requirements | N | ✓ |
| 02 — Design | N | ✓ |
| 03 — Data | 3 | ✓ |
| 04 — Architecture | N | ✓ |
| 05 — Developer Experience | 6 | ✓ |
| 06 — Operations | N | ✓ |
| 07 — Frontend Design | N | ✓ |

Then confirm: **All documents written to `documentation/`.**
