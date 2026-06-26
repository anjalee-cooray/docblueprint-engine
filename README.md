# docblueprint-engine

Spec-driven documentation engine. AI generates every document, humans review and approve.

This monorepo contains two packages:

| Package | Purpose |
|---------|---------|
| [`docblueprint-engine-template/`](./docblueprint-engine-template/) | GitHub template repo — clone this to start a new project |
| [`docblueprint-engine-cli/`](./docblueprint-engine-cli/) | npm CLI package — the engine that drives document generation |

---

## How it fits together

```
docblueprint-engine-template/   ← teams clone this
├── .docblueprint.json          ← built by the CLI interview command
├── project-docs/               ← 99 documents filled by the CLI
└── ...

docblueprint-engine-cli/        ← published to npm as docblueprint-engine
└── src/
    ├── commands/interview.ts   ← builds .docblueprint.json
    ├── commands/generate-docs.ts ← fills project-docs/
    └── commands/validate.ts    ← checks consistency
```

Teams use the template. The CLI does the work. `.docblueprint.json` is the contract between them.

---

## Getting started

See [`docblueprint-engine-template/README.md`](./docblueprint-engine-template/README.md) for the full usage guide.

```bash
gh repo create my-project --template org/docblueprint-engine-template --clone
cd my-project
npx docblueprint-engine interview
```

---

## Working on the CLI

```bash
cd docblueprint-engine-cli
npm install
npm run dev        # tsx watch
npm run build      # tsc
npm test           # vitest
```

---

## Contributing

- CLI changes go in `docblueprint-engine-cli/src/`
- Template structure changes go in `docblueprint-engine-template/project-docs/`
- Keep document IDs stable — the validator and downstream tools depend on them
- Update `.docblueprint.schema.json` whenever the config shape changes
