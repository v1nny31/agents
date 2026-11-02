# Code intelligence plugins

Code intelligence plugins connect Claude Code to a language server, one plugin per language. Claude then sees type errors and missing imports right after its edits, and can find definitions and references by symbol instead of by text search. See the [official guide](https://code.claude.com/docs/en/plugins/code-intelligence).

These plugins are for Claude Code only, and they don't run in cloud sessions.

## When to use this file

Follow these steps when you set up a project, or when a project starts using a new language:

1. Work out which languages the project uses, then find each one in the table below.
2. Check which plugins are already installed with `claude plugin list`. If `claude` isn't on your PATH, ask the user to check with `/plugin`, or `/plugins` in the VS Code extension.
3. Tell the user which plugins and language servers are missing, and ask before installing anything. Both change their machine, not just this project.

## Plugins by language

| Language | Plugin | Language server binary |
|---|---|---|
| C/C++ | [`clangd-lsp`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/clangd-lsp) | `clangd` |
| C# | [`csharp-lsp`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/csharp-lsp) | `csharp-ls` |
| Go | [`gopls-lsp`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/gopls-lsp) | `gopls` |
| Java | [`jdtls-lsp`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/jdtls-lsp) | `jdtls` |
| Kotlin | [`kotlin-lsp`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/kotlin-lsp) | `kotlin-lsp` |
| Liquid | [`liquid-lsp`](https://github.com/Shopify/liquid-skills/tree/main/plugins/liquid-lsp) | `shopify`, from the Shopify CLI |
| Lua | [`lua-lsp`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/lua-lsp) | `lua-language-server` |
| PHP | [`php-lsp`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/php-lsp) | `intelephense` |
| Python | [`pyright-lsp`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/pyright-lsp) | `pyright-langserver` |
| Ruby | [`ruby-lsp`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/ruby-lsp) | `ruby-lsp` |
| Rust | [`rust-analyzer-lsp`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/rust-analyzer-lsp) | `rust-analyzer` |
| Swift | [`swift-lsp`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/swift-lsp) | `sourcekit-lsp` |
| TypeScript and JavaScript | [`typescript-lsp`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/typescript-lsp) | `typescript-language-server` |

If a language isn't listed, it has no official plugin. To connect a language server anyway, see [LSP servers in plugin components](https://code.claude.com/docs/en/plugins/components.md#lsp-servers).

## Install

Each language needs both a plugin and a language server binary, because the plugin doesn't include the server. The default user scope covers every project on the machine, so each language only needs installing once per machine.

1. Install the binary, using the command in the README linked from the plugin's name in the table. For TypeScript, that's:

   ```
   npm install -g typescript-language-server typescript
   ```

2. Confirm the binary is on the PATH of the shell that starts Claude Code, with `which <binary>` or, in PowerShell, `Get-Command <binary>`.

3. Install the plugin, using whichever of these fits:

   - **In a terminal session:** run `/plugin install <plugin>@claude-plugins-official` and choose a scope.
   - **In the VS Code extension:** type `/plugins`, then search for the plugin on the **Plugins** tab and click **Install**. If the tab lists no plugins, add `anthropics/claude-plugins-official` on the **Marketplaces** tab first.
   - **From a shell, outside a session:** run `claude plugin install <plugin>@claude-plugins-official`. If the marketplace isn't found, first run `claude plugin marketplace add anthropics/claude-plugins-official`.

4. Confirm the server starts. It starts the first time Claude edits a file of that language, so have Claude introduce a type error and then fix it. The edit should show `Found N new diagnostic issues in M files`.

   If that line doesn't appear, run `/plugin` and open the **Errors** tab. `Executable not found in $PATH: "<binary>"` means the binary is missing or isn't on the PATH. Otherwise, see [Troubleshoot plugins](https://code.claude.com/docs/en/plugins/troubleshooting.md#language-server-doesnt-start).
