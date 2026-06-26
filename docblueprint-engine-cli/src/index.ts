#!/usr/bin/env node
import { Command } from 'commander';
import { runInterview } from './commands/interview.js';
import { runGenerateDocs } from './commands/generate-docs.js';
import { runValidate } from './commands/validate.js';

const program = new Command();

program
  .name('docblueprint-engine')
  .version('0.1.0')
  .description('Spec-driven documentation engine — AI generates, human reviews');

program
  .command('interview')
  .description('Run the AI interview to build .docblueprint.json')
  .action(runInterview);

program
  .command('generate:docs')
  .description('Generate all 99 documents from .docblueprint.json in dependency order')
  .action(runGenerateDocs);

program
  .command('validate')
  .description('Validate consistency across all generated documents')
  .action(runValidate);

program.parse(process.argv);
