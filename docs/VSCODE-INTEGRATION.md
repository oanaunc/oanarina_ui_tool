# VS Code integration

Forma reaches VS Code through its free local MCP server, not through a VS Code extension. There is no Forma extension, no panel inside VS Code and no live canvas in the editor.

## Setup

1. Download the MCP server from Resources in the Mac app, or use a checkout, as in [the MCP guide](../mcp/README.md).
2. In the same dialog choose **MCP host → VS Code** and enter the server and project paths.
3. Save the configuration as `.vscode/mcp.json` in your project, or run the shown `code --add-mcp` command to add it to your VS Code profile.

VS Code asks you to trust the server before starting it. The server then runs over standard input and output, opens no network listener and reaches only the one saved project named at launch.

From there an MCP-capable chat in VS Code can read the project, the design system and library context, and apply reviewed edits. Tools that read the open window need **Resources → Share Live Editor Context with MCP** in the Mac app.

## What was checked

`mcp/tests/vscode-config.test.ts` builds the configuration the app shows, reads it back as JSON, launches the server with exactly that command and those arguments through the real MCP SDK client, lists tools and reads the project. On VS Code 1.140.0, `code --user-data-dir <temporary folder> --add-mcp` accepted the command the app shows and wrote the server entry to that profile's `mcp.json`.

## What was not checked

No chat session inside VS Code called a tool. That needs a signed-in agent, which this project does not exercise. Windows and Linux shells are also unverified, and the command's quoting is written for a POSIX shell.
