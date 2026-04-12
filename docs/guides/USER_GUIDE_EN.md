# PromptForge User Guide

This guide helps new users learn PromptForge quickly, whether they prefer one-shot CLI usage or the full-screen TUI workflow.

## 1. What PromptForge Does

PromptForge turns rough ideas into clearer, more structured, agent-ready prompts.

It supports two main modes:

- CLI for quick one-off enhancement
- TUI for iterative editing, diff review, provider switching, and feedback loops

## 2. Requirements

- Node.js `>=20`
- An OpenAI-compatible provider
- A valid API key

## 3. Install

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

## 4. Configuration

PromptForge looks for config files in this order:

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

Recommended practices:

- Use `env:VARIABLE_NAME` for API keys
- Keep local config out of Git
- Prefer `~/.promptforge/config.json` for personal setup

## 5. Quick Start

Enhance a prompt directly:

```bash
promptforge "Write a TypeScript decorator pattern example"
```

Read from a file:

```bash
promptforge --file prompt.txt
```

Read from stdin:

```bash
cat prompt.txt | promptforge
echo "Design a code review agent prompt" | promptforge --level deep
```

Launch the TUI:

```bash
promptforge -i
```

## 6. CLI Usage

Basic syntax:

```bash
promptforge [options] [prompt]
```

Common options:

- `-i, --interactive`
- `--file PATH`
- `--provider NAME`
- `--level light|standard|deep`
- `--format md|txt|json|yaml`
- `--output PATH`
- `--quiet`
- `--copy`
- `--help`
- `--version`

Examples:

```bash
promptforge --level light "Improve this daily report prompt"
promptforge "Write a REST API prompt" --format json
promptforge --level deep "Design a coding agent prompt for bug triage"
promptforge --file prompt.txt --output enhanced.txt
promptforge --file prompt.txt --format yaml --output enhanced.yaml
promptforge "Generate a test plan" --quiet > result.txt
promptforge "Write an interviewer prompt" --copy
```

## 7. TUI Workflow

The TUI is best when you want to inspect and refine prompts interactively.

Typical flow:

1. Enter a rough prompt
2. Press `Enter` to enhance
3. Review the result
4. Press `d` to inspect the diff
5. Press `f` to submit feedback
6. Press `h` to reopen earlier versions
7. Press `c` or `x` to copy or export the final result

## 8. Main Shortcuts

Global:

- `Ctrl+K` or `:` opens the command palette
- `?` opens help
- `q` quits

Main view:

- `Enter` enhances the prompt
- `ESC` switches to command mode
- `i` returns to input mode
- `h` opens history
- `m` opens provider selection
- `d` opens diff view
- `f` opens feedback
- `c` copies the result
- `x` exports the result
- `r` resets the current session

Diff view:

- `Tab` switches focus between panes
- `a` toggles alignment mode
- `n` or `]` jumps to the next hunk
- `N` or `[` jumps to the previous hunk
- number + `Enter` jumps to a specific hunk
- `Backspace` clears typed hunk digits

## 9. How to Read the Diff View

The diff view helps you compare the original prompt and the enhanced result.

You will usually see:

- `Original`
- `Enhanced`
- `Hunks`
- `Patch View`

Recommended reading order:

1. Check `Hunks` for the change outline
2. Review `Patch View` for line-level edits
3. Use `n` / `N` or a hunk number to jump directly

## 10. Feedback Iteration

After the first enhancement, you can refine the result without rewriting the original prompt.

Good feedback examples:

- “Make it shorter”
- “Keep Chinese technical terms”
- “Add an output format”
- “Make it more suitable for a coding agent”
- “Reduce background context and strengthen constraints”

Best practice:

- Change one thing at a time
- Use small, clear iterations

When exporting from the TUI:

- press `x` to open the export picker
- choose `md`, `txt`, `json`, or `yaml`
- press `Enter` to export or `ESC` to cancel

## 11. Choosing Enhancement Levels

### `light`

Use for:

- small edits
- gentle cleanup
- preserving the original structure

### `standard`

Use for:

- most daily usage
- balanced structure improvement
- clearer task framing without over-expansion

### `deep`

Use for:

- agent prompts
- complex task decomposition
- stronger constraints and output formatting

Practical advice:

- Start with `standard` if unsure
- Use `deep` when you want a more executable spec-like prompt

## 12. Recommended Workflows

Daily prompt optimization:

```bash
promptforge "Improve this writing assistant prompt"
```

Complex task design:

```bash
promptforge --level deep "Design a system prompt for a multi-file code-fix agent"
```

File-based workflow:

```bash
promptforge --file draft.txt --output final.txt
```

Interactive workflow:

```bash
promptforge -i
```

## 13. Troubleshooting

### `No configuration found`

Create `~/.promptforge/config.json` or launch `promptforge -i`.

### `API key not configured`

Set an environment variable such as `OPENAI_API_KEY`, or update your provider config.

### `Provider "<name>" not configured`

Check that `defaultProvider` matches a key under `providers`.

### `Model not specified`

Set `defaultModel` either at the provider level or the top level.

### Narrow terminal layout feels crowded

PromptForge supports responsive layouts, but these tips still help:

- prefer terminals with `80+` columns
- use `Ctrl+K` when the UI feels dense
- use CLI mode for very narrow terminals

## 14. New User Practice Path

If this is your first session:

1. Run:

```bash
promptforge "Write a TypeScript decorator pattern example"
```

2. Launch the TUI:

```bash
promptforge -i
```

3. Try these actions:

- `Ctrl+K` to open the command palette
- `d` to inspect the diff
- `f` to submit feedback
- `h` to browse history

4. Export a result:

```bash
promptforge --file prompt.txt --output result.txt
```

## 15. Summary

If you remember only three things:

- use CLI for one-off work
- use TUI for iterative refinement
- use `Ctrl+K` whenever you forget a shortcut

That is enough to work effectively with PromptForge.
