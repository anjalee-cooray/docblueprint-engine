import chalk from 'chalk';
import { readConfig, writeConfig } from '../utils/file.js';
import path from 'path';
import fs from 'fs-extra';

export async function runInterview(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error(chalk.red('\n✗ ANTHROPIC_API_KEY is not set.'));
    console.error('  Get your key at https://console.anthropic.com');
    console.error('  Then: export ANTHROPIC_API_KEY=sk-ant-...\n');
    process.exit(1);
  }

  const configPath = path.join(process.cwd(), '.docblueprint.json');
  if (!fs.existsSync(configPath)) {
    await writeConfig({});
    console.log(chalk.dim('Created .docblueprint.json'));
  }

  console.log('\n' + chalk.bold('docblueprint-engine — project interview'));
  console.log('─'.repeat(42));
  console.log(chalk.dim('The AI will ask one question at a time.'));
  console.log(chalk.dim('Answer in plain language — it extracts structured data from your responses.'));
  console.log('');

  console.log(chalk.bold('Topics this interview covers:'));
  const topics = [
    ['Product description', 'What does this product do and who is it for?'],
    ['Business model',      'B2B / B2C / B2B2C / SaaS / PaaS'],
    ['Domain',              'Industry vertical (fintech, healthtech, edtech …)'],
    ['Personas',            'Who are your users? Roles, goals, pain points'],
    ['Main flows',          'The critical user journeys — signup, core action, billing …'],
    ['Stack preferences',   'Backend, frontend, mobile, database choices'],
    ['Cloud provider',      'AWS / GCP / Azure / multi-cloud'],
    ['Compliance',          'HIPAA / GDPR / SOC2 / PCI-DSS / none'],
  ];

  for (const [topic, hint] of topics) {
    console.log(`  ${chalk.cyan('•')} ${chalk.bold(topic)}`);
    console.log(`    ${chalk.dim(hint)}`);
  }

  console.log('');

  // TODO: Implement the conversational interview loop.
  //
  // How it works:
  //   1. For each topic, send a system prompt instructing Claude to ask a single
  //      focused question about that topic.
  //   2. Stream the question to the terminal.
  //   3. Read the user's answer from stdin (readline).
  //   4. Send the answer back to Claude with a structured extraction prompt:
  //      "Extract the relevant fields from this answer and return JSON matching
  //      the .docblueprint.schema.json for the [topic] section."
  //   5. Merge the extracted JSON into the working config object.
  //   6. Optionally ask a follow-up if Claude detected ambiguity.
  //   7. After all topics, show a summary and ask for confirmation before writing.
  //   8. Write the final config to .docblueprint.json.
  //
  // Use BlueprintAIClient from src/ai/client.ts for all Claude calls.
  // Use streaming so responses appear in real time.

  console.log(chalk.yellow('Interview not yet implemented.'));
  console.log(chalk.dim('Run `npx docblueprint-engine generate:docs` after manually filling .docblueprint.json.'));
  console.log('');
}
