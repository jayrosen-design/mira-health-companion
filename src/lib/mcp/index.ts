import { defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";

export default defineMcp({
  name: "mira-chat-mcp",
  title: "MIRA Chat MCP",
  version: "0.1.0",
  instructions:
    "Tools for the MIRA parent-conversation simulator. Use `echo` to verify connectivity.",
  tools: [echoTool],
});