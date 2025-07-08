import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema, 
  ListResourcesRequestSchema, 
  ReadResourceRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';

import toolsHandler from './handlers/tools.js';
import resourcesHandler from './handlers/resources.js';

const createServer = () => {
  const server = new Server(
    {
      name: "real-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Health check method (MCP doesn't use HTTP, but keeping for compatibility)
  const getHealth = () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  };

  // MCP info method
  const getMcpInfo = () => {
    return {
      version: '1.0.0',
      capabilities: ['tools', 'resources']
    };
  };

  // Tools handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    try {
      const result = await toolsHandler.listTools();
      return result;
    } catch (error) {
      throw new Error(`Failed to list tools: ${error.message}`);
    }
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const result = await toolsHandler.callTool(request.params);
      return result;
    } catch (error) {
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  });

  // Resources handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
      const result = await resourcesHandler.listResources();
      return result;
    } catch (error) {
      throw new Error(`Failed to list resources: ${error.message}`);
    }
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    try {
      const result = await resourcesHandler.readResource(request.params);
      return result;
    } catch (error) {
      throw new Error(`Failed to read resource: ${error.message}`);
    }
  });

  return {
    server,
    getHealth,
    getMcpInfo,
    async run() {
      const transport = new StdioServerTransport();
      await server.connect(transport);
      
      // Keep the process running
      process.stdin.resume();
    }
  };
};

export default createServer;