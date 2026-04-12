# PromptForge

PromptForge is an AI-powered CLI and Ink TUI for turning rough prompts into structured, agent-ready prompts.

## Features

- CLI mode for one-off prompt enhancement
- Full-screen TUI mode with history, provider switching, feedback iteration, command palette, and diff navigation
- Multiple enhancement levels: `light`, `standard`, and `deep`
- Provider/model configuration with `env:VARIABLE_NAME` API key references
- Streaming output, copy support, file output, and local history

## Requirements

- Node.js `>=20`
- An OpenAI-compatible API provider and API key

## Install

For local development:

```bash
npm install
npm run build
node dist/cli.js --help
```

After publishing to npm:

```bash
npm install -g promptforge
promptforge --help
```

## Configuration

PromptForge searches for config files in this order:

1. `promptforge.config.json`
2. `.promptforgerc`
3. `.promptforgerc.json`
4. `~/.promptforge/config.json`
5. `~/.promptforgerc`
6. `~/.promptforgerc.json`

Recommended config:

```json
{
  "defaultProvider": "openai",
  "defaultLevel": "standard",
  "theme": "dark",
  "autoSave": true,
  "maxHistoryDays": 30,
  "providers": {
    "openai": {
      "baseURL": "https://api.openai.com/v1",
      "defaultModel": "gpt-4o",
      "apiKey": "env:OPENAI_API_KEY"
    }
  }
}
```

Keep API keys out of Git. Local PromptForge config files are ignored by `.gitignore`.

## Usage

Documentation:

- `docs/README.md` — documentation index
- `docs/guides/USER_GUIDE.md` — detailed Chinese user manual
- `docs/guides/VISUAL_GUIDE.md` — visual TUI walkthrough
- `docs/guides/USER_GUIDE_EN.md` — English user guide
- `docs/project/ROADMAP.md` — development and maintenance roadmap

Interactive TUI:

```bash
promptforge -i
```

CLI mode:

```bash
promptforge "帮我写一个 TypeScript 中的装饰器模式示例"
promptforge "帮我写一个 REST API" --format json
promptforge --level deep "Design a code review agent prompt"
cat prompt.txt | promptforge --quiet > enhanced.txt
cat prompt.txt | promptforge --format yaml > enhanced.yaml
promptforge --file prompt.txt --output enhanced.txt
```

Useful TUI shortcuts:

- `Ctrl+K` or `:` opens the command palette
- `h` opens history
- `m` opens provider/model selection
- `d` opens diff view
- `f` opens feedback iteration
- `x` opens export format picker
- `?` opens help
- `q` exits

## Development

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

Release gate:

```bash
npm run release:check
npm run pack:dry
```

## npm Publishing Checklist

1. Confirm no local config or API keys are staged.
2. Run `npm run release:check`.
3. Run `npm run pack:dry` and inspect the tarball contents.
4. Bump `package.json` version if needed.
5. Publish with `npm publish`.

## Release Notes

- Track user-facing changes in `CHANGELOG.md`.
- Keep `LICENSE` included in the published package.
- Review the generated tarball before every publish.

## Troubleshooting

- `No configuration found`: run `promptforge -i` or create `~/.promptforge/config.json`.
- `API key not configured`: set `OPENAI_API_KEY` or update your provider config.
- `Provider "<name>" not configured`: check `defaultProvider` matches a key under `providers`.
- `Model not specified`: set `defaultModel` on the provider or top-level config.

## License

MIT. See `LICENSE`.
