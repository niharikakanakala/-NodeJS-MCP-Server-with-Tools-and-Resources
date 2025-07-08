import createServer from "./src/server.js";
import dotenv from 'dotenv';

dotenv.config();

const mcpServer = createServer();

// Note: This is a Real MCP Server - it doesn't use HTTP like a regular web server


async function startServer() {
  try {
    console.log(`🚀 Real MCP Server starting...`);
    console.log(`🔌 MCP Protocol: JSON-RPC over stdio (not HTTP)`);
    console.log(`📖 To use: Connect this server to MCP-enabled AI applications`);
    console.log(`⚡ Starting MCP server...`);
    
    await mcpServer.run();
    
    console.log(`✅ MCP Server is running and ready for connections`);
    console.log(`🤖 Connect this to Claude Desktop or other MCP clients`);
    
  } catch (error) {
    console.error('❌ Failed to start MCP Server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MCP Server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down MCP Server...');
  process.exit(0);
});

// Start the MCP server
startServer();

export default mcpServer;