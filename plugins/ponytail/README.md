# Ponytail

[Ponytail on GitHub](https://github.com/dietrichgebert/ponytail) is a prompt that makes coding agents write less code.

**Use it for:** any project.

## Add it to `AGENTS.md`

[AGENTS.md](AGENTS.md) in this folder is Ponytail's ruleset, copied unchanged. **It must be added to the project's existing `AGENTS.md`, not used in place of it.** Replacing the file would delete the kit's rules.

Do this in each project:

1. Paste this folder's `AGENTS.md` at the end of the project's `AGENTS.md`.
2. Leave out its last line, the one about agents working on the ponytail repo. It doesn't apply to your project.

This works for every agent that reads `AGENTS.md`, including Claude Code through `CLAUDE.md`.

## Optional: Claude Code plugin

The plugin adds `/ponytail` commands for switching levels. It loads a similar ruleset, so you don't need it just to get the rules.

Run these inside Claude Code, as two separate prompts. Do this once per machine, not once per project:

```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

In the VS Code extension, type `/plugins` instead. Add `DietrichGebert/ponytail` on the **Marketplaces** tab, then install the plugin from the **Plugins** tab.

The plugin's status band needs Claude Code 2.1.290 or later, and doesn't appear in the VS Code chat panel.

## License

Ponytail is MIT licensed. See [LICENSE](LICENSE).
