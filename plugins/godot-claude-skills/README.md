# Godot Claude Skills

[godot-claude-skills on GitHub](https://github.com/alexmeckes/godot-claude-skills) is a Claude Code plugin with skills for GDScript, scenes, shaders, and live editing in Godot.

**Use it for:** Godot 4.x projects.

**Needs:** Claude Code. The plugin doesn't support other agents.

## Install

Run these inside Claude Code. Do this once per machine, not once per project:

```
/plugin marketplace add alexmeckes/godot-claude-skills
/plugin install godot-claude-skills
```

## Optional: godot-mcp

The skills only provide guidance. [godot-mcp](https://github.com/alexmeckes/godot-mcp) is the MCP server that lets the agent read and write Godot files and control the editor. The plugin's authors highly recommend installing it. It needs Node.

1. Build the server. Do this once per machine, in any folder outside your projects:

   ```
   git clone https://github.com/alexmeckes/godot-mcp.git
   cd godot-mcp
   npm install
   npm run build
   ```

2. Register it in each Godot project, from that project's root. This needs the `claude` CLI on your PATH:

   ```
   claude mcp add godot-mcp -- node /path/to/godot-mcp/dist/index.js --project /path/to/your/godot/project
   ```

   The default scope keeps this private to you, so these machine-specific paths don't get committed.

3. For live editor control, add the Godot AI Bridge plugin to each Godot project. File editing works without it.

   1. Copy the plugin from your godot-mcp clone:

      ```
      cp -r addons/godot_ai_bridge /path/to/your/godot/project/addons/
      ```

   2. In Godot, go to **Project > Project Settings > Plugins** and set **Godot AI Bridge** to **Active**.
   3. Check that the Output panel shows `[AI Bridge] Server started on port 6550`.
