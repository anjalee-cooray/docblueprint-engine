import chalk from 'chalk';
import { listDocs, readDoc, isPlaceholder } from '../utils/file.js';
import path from 'path';

export async function runValidate(): Promise<void> {
  console.log('\n' + chalk.bold('docblueprint-engine — validation report'));
  console.log('─'.repeat(42));

  const docs = await listDocs();

  if (docs.length === 0) {
    console.log(chalk.yellow('No documents found in project-docs/'));
    console.log(chalk.dim('Run: npx docblueprint-engine generate:docs\n'));
    return;
  }

  const results: Array<{ file: string; status: 'complete' | 'placeholder' }> = [];

  for (const docPath of docs) {
    const content = await readDoc(docPath.file);
    const status = isPlaceholder(content) ? 'placeholder' : 'complete';
    results.push({ file: docPath.file, status });
  }

  const complete = results.filter(r => r.status === 'complete');
  const placeholders = results.filter(r => r.status === 'placeholder');

  console.log(`\n  Total documents : ${chalk.bold(results.length)}`);
  console.log(`  Complete        : ${chalk.green(complete.length)}`);
  console.log(`  Placeholders    : ${chalk.yellow(placeholders.length)}`);
  console.log('');

  if (placeholders.length > 0) {
    console.log(chalk.yellow('Placeholder documents (not yet generated):'));
    for (const doc of placeholders) {
      console.log(`  ${chalk.dim('—')} ${path.relative(process.cwd(), doc.file)}`);
    }
    console.log('');
  }

  if (complete.length > 0) {
    console.log(chalk.green('Generated documents:'));
    for (const doc of complete) {
      console.log(`  ${chalk.dim('✓')} ${path.relative(process.cwd(), doc.file)}`);
    }
    console.log('');
  }

  // TODO: Implement full drift detection and consistency validation.
  //
  // Full validation logic:
  //   1. Flow registry consistency
  //      - Parse all FLOW-IDs from R5-flow-registry.md.
  //      - Scan every other document for FLOW-ID references.
  //      - Report any reference to an ID not in the registry (orphaned reference).
  //      - Report any flow in the registry with no downstream references (unused flow).
  //
  //   2. Cross-document consistency checks
  //      - Persona IDs referenced in journey docs match personas in R4a files.
  //      - API endpoints in D5 match sequence diagrams in D3.
  //      - Acceptance criteria in R10 reference flows that exist in R5.
  //      - DB schema in D8 is consistent with data model in D1.
  //
  //   3. Staleness detection
  //      - Compare each doc's "Last updated" frontmatter timestamp against
  //        the timestamps of its upstream dependencies.
  //      - Flag any doc whose upstream was updated more recently than itself.
  //
  //   4. Completeness check
  //      - Verify every flow in the registry has a corresponding flow spec (D2),
  //        sequence diagram (D3), and user story set (D12).
  //
  // All findings should include file path, line number, and a plain-language
  // description so the user can navigate directly to the issue.

  if (placeholders.length === results.length) {
    console.log(chalk.dim('Run `npx docblueprint-engine generate:docs` to generate your documents.'));
  } else if (placeholders.length === 0) {
    console.log(chalk.green('All documents are generated.'));
    console.log(chalk.dim('Full drift detection not yet implemented.'));
  } else {
    console.log(chalk.dim('Full drift detection not yet implemented.'));
  }

  console.log('');
}
