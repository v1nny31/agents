# agent-skills

[agent-skills on GitHub](https://github.com/addyosmani/agent-skills) is a set of 25 engineering workflow skills covering planning, building, testing, review, and shipping.

**Use it for:** any project.

## Install

Run these inside Claude Code. Do this once per machine, not once per project:

```
/plugin marketplace add addyosmani/agent-skills
/plugin install agent-skills@addy-agent-skills
```

In the VS Code extension, type `/plugins` instead. Add `addyosmani/agent-skills` on the **Marketplaces** tab, then install the plugin from the **Plugins** tab.

## Before you install

- **It overlaps with this kit.** Its `code-review-and-quality`, `git-workflow-and-versioning`, and `test-driven-development` skills cover similar ground to `AGENTS.md` and the kit's `code-review` skill. If they disagree, `AGENTS.md` should win.
- **Other agents:** see the [repo's README](https://github.com/addyosmani/agent-skills). A per-skill `npx skills` install leaves out the shared `references/` folder.
