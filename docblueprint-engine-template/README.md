# docblueprint-engine

A spec-driven documentation engine. AI generates every document, humans review and approve. The result is 99 structured documents across 7 categories — a complete single source of truth before a single line of code is written.

---

## What is docblueprint-engine?

Most teams write docs after the fact, if at all. docblueprint-engine flips this. You answer questions in a conversational interview. The AI uses your answers to generate a full document suite in strict dependency order — governance first, then requirements, design, data, architecture, developer experience, and operations.

Every document is a draft. You read it. You correct it in plain language. The AI regenerates. Corrections cascade downstream — if you change a requirement, every document that depends on it is flagged as stale.

The result: a complete, consistent, traceable specification before any implementation begins.

---

## How it works

### Step 1 — Interview

```bash
npx docblueprint-engine interview
```

The CLI asks one question at a time. You answer in plain language. The AI extracts structured data from your responses and progressively builds `.docblueprint.json`. Topics covered: product description, business model, domain, personas, main user flows, stack preferences, cloud provider, compliance requirements.

### Step 2 — Generate docs

```bash
npx docblueprint-engine generate:docs
```

Generates all 99 documents layer by layer in strict dependency order. Each document is a Claude API call with all approved upstream documents as context. You review each layer before the next generates. If something is wrong, correct it in plain language and the CLI regenerates.

### Step 3 — Validate

```bash
npx docblueprint-engine validate
```

Checks consistency across all documents. Verifies that flow registry IDs are referenced correctly throughout. Flags documents that are still placeholders. Reports drift — documents that reference stale upstream data.

---

## The 7 document categories

| # | Category | Docs | Purpose |
|---|----------|------|---------|
| 00 | **Governance** | 5 | Project charter, RACI matrix, risk register, change log, definition of done |
| 01 | **Requirements** | 11 | Domain glossary, stakeholder map, BRD, personas, flow registry, user journeys, PRD, use cases, NFRs, acceptance criteria, compliance |
| 02 | **Design** | 12 | Data model, flow specs, sequence diagrams, state machines, API design, functional spec, error handling, DB schema, notifications, UI/UX spec, test strategy, user stories |
| 03 | **Data** | 3 | Data dictionary, data flow diagram, seed data strategy |
| 04 | **Architecture** | 13 + 20 flows | System arch, tech stack, security model, threat model, data privacy, infrastructure, scaling, deployment, integrations, observability, disaster recovery, multi-tenancy, ADRs — plus infra/cicd/secrets/resilience/observability flows |
| 05 | **Developer Experience** | 6 | Local setup guide, coding standards, git workflow, PR review guide, system walkthrough, developer FAQ |
| 06 | **Operations** | 6 + 17 flows | Release plan, feature flag strategy, rollback plan, runbook, incident response, secrets rotation policy — plus release/flag/version/hotfix/comms flows |

**Total: 99 documents**

---

## Document ordering — why it matters

Documents are generated in strict dependency order. Each document is context for the next.

- Domain Glossary → BRD (shared vocabulary before business requirements)
- BRD → PRD (business goals before product decisions)
- Personas → User Journeys (who before what)
- Data Model → Sequence Diagrams (entities before interactions)
- Sequence Diagrams → API Design (interactions before contracts)
- Flow Specs → User Stories (flows before story decomposition)
- All of the above → Architecture (decisions informed by requirements)
- Architecture → Developer Experience (system understood before onboarding)
- Everything → Operations (operations planned last, informed by everything)

Skipping layers produces documents that contradict each other. The CLI enforces the order.

---

## The flow registry — the spine of everything

`01-requirements/R5-flow-registry.md` assigns a unique `FLOW-ID` to every user journey in the system.

Every downstream document references flows by ID. A sequence diagram references `FLOW-003`. An acceptance criterion references `FLOW-003`. A feature flag references `FLOW-003`. The validator checks every reference is consistent.

This creates end-to-end traceability: business goal → user flow → functional spec → acceptance criteria → test case. Nothing falls through the cracks.

---

## The review loop

Human never writes from scratch.

```
AI drafts → Human reviews → Human corrects in plain language → AI regenerates
```

Corrections cascade. If you change a persona's goal in `R4a`, the CLI flags `R6` (journeys), `R7` (PRD), `R10` (acceptance criteria), and `D10` (UI/UX spec) as stale and offers to regenerate them with the updated context.

The correction loop uses the same Claude API call pattern — the AI sees the original draft, the human's correction note, and regenerates the document incorporating the feedback.

---

## Business model extensions

The generated document set adapts to your business model. Additional documents are included automatically based on your `businessModel` config:

**B2B** — org hierarchy model, SSO architecture, audit log spec, admin panel design, multi-org data isolation

**B2C** — onboarding flow specs, notification design, retention mechanics, consumer compliance addenda

**SaaS** — multi-tenancy architecture, subscription billing design, usage metering, plan entitlements

**PaaS** — API-first architecture, developer DX docs, SDK documentation plan, rate limiting design, webhook spec

**B2B2C** — three-sided permission model, white-labeling architecture, partner dashboard specs, tenant customisation model

---

## Folder structure

```
project-docs/
├── 00-governance/           Project charter, RACI, risks, change log, definition of done
├── 01-requirements/
│   ├── personas/            One file per persona
│   └── journeys/            One file per user journey
├── 02-design/
│   ├── flow-specs/          Detailed flow specifications
│   ├── sequence-diagrams/   Mermaid sequence diagrams
│   └── user-stories/        Story decompositions per flow
├── 03-data/                 Data dictionary, flow diagram, seed strategy
├── 04-architecture/
│   ├── adrs/                Architecture Decision Records
│   ├── infra-flows/         Infrastructure provisioning flows
│   ├── cicd-flows/          CI/CD pipeline flows
│   ├── secrets-flows/       Secrets management flows
│   ├── resilience-flows/    Auto-scaling, incident response, DR flows
│   └── observability-flows/ Logging, alerting, tracing flows
├── 05-developer-experience/ Local setup, standards, git workflow, PR guide, walkthrough, FAQ
├── 06-operations/
│   ├── release-flows/       RC cut → validation → go/no-go → production → stabilisation
│   ├── flag-flows/          Feature flag lifecycle flows
│   ├── version-flows/       Versioning and deprecation flows
│   ├── hotfix-flows/        Hotfix and emergency change flows
│   └── comms-flows/         Release comms and retrospective flows
└── fe-design/
    ├── lofi/web/            Low-fidelity wireframes (web)
    ├── lofi/mobile/         Low-fidelity wireframes (mobile)
    ├── hifi/web/            High-fidelity specs (web)
    ├── hifi/mobile/         High-fidelity specs (mobile)
    └── component-specs/     Component specification templates

scripts/
└── setup.sh                 Prerequisite check script

.docblueprint.json           Your project config (built by the interview command)
.docblueprint.schema.json    JSON schema for .docblueprint.json
Makefile                     Convenience targets: interview, generate, validate
```

---

## Prerequisites

- **Node.js 18+** — check with `node --version`
- **Anthropic API key** — set as `ANTHROPIC_API_KEY` environment variable

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Run the setup check to verify both:

```bash
bash scripts/setup.sh
```

---

## Getting started

```bash
# Create a new project from this template
gh repo create my-project --template org/docblueprint-engine-template --clone
cd my-project

# Check prerequisites
bash scripts/setup.sh

# Run the interview — builds .docblueprint.json
npx docblueprint-engine interview
# or: make interview

# Generate all 99 documents
npx docblueprint-engine generate:docs
# or: make generate

# Validate consistency
npx docblueprint-engine validate
# or: make validate
```

---

## Contributing

Contributions welcome. The CLI lives in [docblueprint-engine-cli](https://github.com/org/docblueprint-engine-cli).

- Open an issue to discuss changes before submitting a PR
- Follow the existing file naming conventions
- Keep document IDs stable — downstream tools depend on them
- Add entries to the flow registry when adding new flow spec templates

---

*Generated by docblueprint-engine — spec-driven documentation for teams who ship.*
