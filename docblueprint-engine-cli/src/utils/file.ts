import fs from 'fs-extra';
import path from 'path';

const CONFIG_FILE = '.docblueprint.json';
const DOCS_DIR = 'project-docs';
const PLACEHOLDER_MARKER = 'Status:** not started';

export async function readConfig(): Promise<unknown> {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    return null;
  }
  const raw = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(raw);
}

export async function writeConfig(config: unknown): Promise<void> {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

export async function readDoc(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

export async function writeDoc(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

export function isPlaceholder(content: string): boolean {
  return content.includes(PLACEHOLDER_MARKER);
}

export async function listDocs(): Promise<Array<{ file: string }>> {
  const docsDir = path.join(process.cwd(), DOCS_DIR);
  if (!fs.existsSync(docsDir)) {
    return [];
  }

  const results: Array<{ file: string }> = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.md')) {
        results.push({ file: fullPath });
      }
    }
  }

  await walk(docsDir);
  results.sort((a, b) => a.file.localeCompare(b.file));
  return results;
}
