/** The saved-file MCP server as each local host expects to launch it. Nothing here starts a process or reads a path. */
export const MCP_SERVER_NAME='oanarina-ui';
export type McpHost='stdio'|'vscode';
export const mcpLaunchArguments=(server:string,project:string)=>[server,'--project',project];
/** Generic hosts use mcpServers. VS Code reads .vscode/mcp.json, whose root key is servers and whose entries name their transport. */
export function mcpHostConfig(host:McpHost,server:string,project:string){const args=mcpLaunchArguments(server,project);return host==='vscode'?{servers:{[MCP_SERVER_NAME]:{type:'stdio',command:'node',args}}}:{mcpServers:{[MCP_SERVER_NAME]:{command:'node',args}}};}
/** One argument for code --add-mcp, which adds the server to a VS Code profile. Single quotes keep spaces and backslashes intact in a POSIX shell. */
export const vscodeAddMcpCommand=(server:string,project:string)=>"code --add-mcp '"+JSON.stringify({name:MCP_SERVER_NAME,type:'stdio',command:'node',args:mcpLaunchArguments(server,project)}).replaceAll("'","'\\''")+"'";
