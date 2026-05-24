import { startHandshakeMcpStdioServer } from "./server";

if (import.meta.main) {
  try {
    await startHandshakeMcpStdioServer();
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({
        errorCode: "handshake_mcp_stdio_start_failed",
        message: error instanceof Error ? error.message : "Handshake MCP stdio server failed to start.",
      })}\n`,
    );
    process.exitCode = 1;
  }
}
