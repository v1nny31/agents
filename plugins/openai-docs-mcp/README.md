# OpenAI Docs MCP

The [OpenAI Docs MCP server](https://developers.openai.com/learn/docs-mcp?setup=claude-code) gives coding agents read-only search and page access to OpenAI's developer documentation. It's an MCP server hosted by OpenAI, not a plugin, and it doesn't call the OpenAI API for you.

**Use it for:** projects that build on OpenAI's APIs.

**Needs:** the `claude` CLI on your PATH.

## Install

Run this from a shell. Do this once per machine, not once per project:

```
claude mcp add --transport http --scope user openaiDeveloperDocs https://developers.openai.com/mcp
```

Then run `/mcp` in Claude Code to confirm it's connected.

To add it to the current project only, leave out `--scope user`.

**Other agents:** the [setup page](https://developers.openai.com/learn/docs-mcp?setup=claude-code) covers Codex, VS Code Copilot, and Cursor.
