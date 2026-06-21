<p align="center">
  <img width="200" alt="TakeDeep logo" src="logo.png" />
</p>

# TakeDeep

TakeDeep is an AI coding agent forked from [Kilo Code](https://github.com/Kilo-Org/kilocode) / [OpenCode](https://github.com/anomalyco/opencode). Generate code from natural language, run terminal commands, automate the browser, and work with 500+ models via managed gateway or your own API keys (BYOK).

| Setting | Value |
|---|---|
| CLI | `deeper` |
| Config | `.takedeep/` |
| API | `https://deeper-api.takedeep.ai` |
| VS Code extension | `takedeep.takedeep` (sideload) |

See [TAKEDEEP.md](./TAKEDEEP.md) for fork-specific setup, environment variables, and migration notes.

## Features

- **Code generation** from natural language
- **Terminal automation** and browser tools
- **MCP marketplace** for extending agent capabilities
- **Multi-mode agents** (plan, code, debug, custom modes)
- **Agent Manager** in VS Code for multi-session workflows with git worktrees
- **BYOK** â€” bring your own keys for Anthropic, OpenAI, OpenRouter, and more

## Sideload the VS Code extension

```bash
cd packages/kilo-vscode
bun script/local-bin.ts
bun run compile
bun run package
```

Install the generated `.vsix` via **Extensions â†’ Install from VSIX**.

## CLI (development)

```bash
# from repo root
bun run dev -- help

# or use the local binary after build
packages/opencode/bin/deeper --version
```

Build a single-platform CLI binary:

```bash
cd packages/opencode
bun run build --single --skip-install
```

### Autonomous mode (CI/CD)

```bash
deeper run --auto "run tests and fix any failures"
```

The `--auto` flag disables permission prompts. Use only in trusted environments such as CI pipelines.

## Monorepo packages

| Package | npm name |
|---|---|
| CLI | `@takedeep/cli` |
| SDK | `@takedeep/sdk` |
| Gateway | `@takedeep/gateway` |
| VS Code extension | `takedeep` (publisher: `takedeep`) |

Physical package directories still use `kilo-*` names to reduce merge friction with upstream.

## Contributing

This fork inherits Kilo Code's contribution workflow. See [CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md) for development setup.

## License

MIT â€” see [LICENSE](./LICENSE).
