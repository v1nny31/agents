# i-have-adhd

[i-have-adhd on GitHub](https://github.com/ayghri/i-have-adhd) makes coding agents format their responses to be ADHD-friendly: action first, numbered steps, no filler.

**Use it for:** any project.

## Install

Run these from a shell. Do this once per machine, not once per project:

```
claude plugin marketplace add ayghri/i-have-adhd
claude plugin install i-have-adhd@i-have-adhd
```

If `claude` isn't on your PATH, type `/plugins` in the VS Code extension instead. Add `ayghri/i-have-adhd` on the **Marketplaces** tab, then install the plugin from the **Plugins** tab.

Restart Claude Code, then turn it on with `/i-have-adhd`.

## Before you install

- **It can load on every session.** A `SessionStart` hook loads the full ruleset whenever `~/.claude/.i-have-adhd-always` exists.
- **It takes priority over part of `AGENTS.md`.** Its "no filler" style wins over section 7's rule to explain every decision, and section 7 says so.
- **Other agents:** see the repo's [INSTALL.md](https://github.com/ayghri/i-have-adhd/blob/main/INSTALL.md).
