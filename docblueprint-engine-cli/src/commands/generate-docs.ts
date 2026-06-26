import chalk from 'chalk';
import { readConfig, isPlaceholder, listDocs } from '../utils/file.js';
import { validateConfig } from '../config/schema.js';

const GENERATION_PLAN: Array<{ layer: string; docs: string[] }> = [
  {
    layer: '00 — Governance',
    docs: [
      'G1 Project Charter',
      'G2 RACI Matrix',
      'G3 Risk Register',
      'G4 Change Log',
      'G5 Definition of Done',
    ],
  },
  {
    layer: '01 — Requirements (foundation)',
    docs: [
      'R1 Domain Glossary',
      'R2 Stakeholder Map',
      'R3 Business Requirements Document',
      'R4a Persona Template (one per persona)',
      'R5 Flow Registry',
    ],
  },
  {
    layer: '01 — Requirements (detail)',
    docs: [
      'R6 User Journey Template (one per flow)',
      'R7 Product Requirements Document',
      'R8 Use Case Document',
      'R9 Non-Functional Requirements',
      'R10 Acceptance Criteria',
      'R11 Compliance Document',
    ],
  },
  {
    layer: '02 — Design (data & flows)',
    docs: [
      'D1 Data Model',
      'D2 Flow Spec Template (one per flow)',
      'D3 Sequence Diagram Template (one per flow)',
      'D4 State Machines',
    ],
  },
  {
    layer: '02 — Design (APIs & UX)',
    docs: [
      'D5 API Design',
      'D6 Functional Specification',
      'D7 Error Handling Specification',
      'D8 Database Schema',
      'D9 Notification Design',
      'D10 UI/UX Specification',
      'D11 Test Strategy',
      'D12 User Stories Template (one per flow)',
    ],
  },
  {
    layer: '03 — Data',
    docs: [
      'DM1 Data Dictionary',
      'DM2 Data Flow Diagram',
      'DM3 Seed Data Strategy',
    ],
  },
  {
    layer: '04 — Architecture (core)',
    docs: [
      'A1 Tech Stack',
      'A2 System Architecture',
      'A3 Multi-Tenancy',
      'A4 Security Model',
      'A5 Threat Model',
      'A6 Data Privacy Architecture',
      'A7 Infrastructure',
      'A8 Scaling Strategy',
      'A9 Deployment',
      'A10 Integrations',
      'A11 Observability',
      'A12 Disaster Recovery',
      'A13 ADR Template',
    ],
  },
  {
    layer: '04 — Architecture (flows)',
    docs: [
      'INF-001–005 Infrastructure Flows',
      'CD-001–005 CI/CD Flows',
      'SEC-001–003 Secrets Flows',
      'RES-001–004 Resilience Flows',
      'OBS-001–003 Observability Flows',
    ],
  },
  {
    layer: '05 — Developer Experience',
    docs: [
      'DX1 Local Setup Guide',
      'DX2 Coding Standards',
      'DX3 Git Workflow',
      'DX4 PR Review Guide',
      'DX5 System Walkthrough',
      'DX6 Developer FAQ',
    ],
  },
  {
    layer: '06 — Operations (core)',
    docs: [
      'O1 Release Plan',
      'O2 Feature Flag Strategy',
      'O3 Rollback Plan',
      'O4 Runbook',
      'O5 Incident Response',
      'O6 Secrets Rotation Policy',
    ],
  },
  {
    layer: '06 — Operations (flows)',
    docs: [
      'REL-001–005 Release Flows',
      'FLAG-001–004 Feature Flag Flows',
      'VER-001–003 Version Flows',
      'HOT-001–003 Hotfix Flows',
      'COM-001–002 Comms Flows',
    ],
  },
];

export async function runGenerateDocs(): Promise<void> {
  const rawConfig = await readConfig();

  if (!rawConfig || Object.keys(rawConfig).length === 0) {
    console.error(chalk.red('\n✗ .docblueprint.json is empty.'));
    console.error('  Run the interview first: npx docblueprint-engine interview\n');
    process.exit(1);
  }

  let config;
  try {
    config = validateConfig(rawConfig);
  } catch (err) {
    console.error(chalk.red('\n✗ .docblueprint.json is invalid.'));
    console.error('  Run the interview to rebuild it: npx docblueprint-engine interview');
    if (err instanceof Error) {
      console.error(chalk.dim(`\n  Details: ${err.message}\n`));
    }
    process.exit(1);
  }

  console.log('\n' + chalk.bold('docblueprint-engine — generation plan'));
  console.log('─'.repeat(42));
  console.log(chalk.dim(`Project: ${config.project.name}`));
  console.log('');

  // TODO: Implement layered document generation.
  //
  // How it works:
  //   1. For each layer in GENERATION_PLAN:
  //      a. Show the layer name and the docs about to be generated.
  //      b. For each doc in the layer, call BlueprintAIClient.generate() with:
  //         - systemPrompt: the document template + instructions for that doc type
  //         - userPrompt: the relevant sections of .docblueprint.json
  //         - context: all previously approved upstream docs (read via listDocs())
  //      c. Stream the generated doc to the terminal.
  //      d. Prompt the user: [A]ccept / [R]eject+correct / [S]kip
  //      e. If rejected, read the correction note, call BlueprintAIClient.review()
  //         to regenerate with the correction applied, then loop back to (d).
  //      f. If accepted, write the doc to the appropriate file in project-docs/.
  //   2. After each layer, ask before proceeding to the next.
  //   3. At the end, run the validator automatically.
  //
  // Correction cascade logic:
  //   When a doc is corrected, record which upstream document changed.
  //   After generation completes, compare the new version against the original.
  //   Any downstream docs that referenced the changed sections should be flagged
  //   as stale. The next run of validate will surface these.

  console.log(chalk.bold('Documents will be generated in this order:\n'));

  for (const layer of GENERATION_PLAN) {
    console.log(`  ${chalk.cyan(layer.layer)}`);
    for (const doc of layer.docs) {
      console.log(`    ${chalk.dim('—')} ${doc}`);
    }
    console.log('');
  }

  console.log(chalk.yellow('Generation not yet implemented.'));
  console.log(chalk.dim('Each layer is a set of Claude API calls with upstream docs as context.'));
  console.log('');
}
