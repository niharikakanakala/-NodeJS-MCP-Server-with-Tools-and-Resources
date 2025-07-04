const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const toolsHandler = require('./handlers/tools');
const resourcesHandler = require('./handlers/resources');

class MCPServer {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // MCP info endpoint
    this.app.get('/mcp/info', (req, res) => {
      res.json({
        name: 'mcp-server',
        version: '1.0.0',
        capabilities: ['tools', 'resources']
      });
    });

    // Tools endpoints
    this.app.get('/tools/list', async (req, res) => {
      try {
        const result = await toolsHandler.listTools();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/tools/call', async (req, res) => {
      try {
        const result = await toolsHandler.callTool(req.body);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Resources endpoints
    this.app.get('/resources/list', async (req, res) => {
      try {
        const result = await resourcesHandler.listResources();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/resources/read', async (req, res) => {
      try {
        const result = await resourcesHandler.readResource(req.body);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Error handling middleware
    this.app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  async start(port = process.env.PORT || 8000) {
    try {
      this.httpServer = this.app.listen(port, () => {
        console.log(`MCP Server running on port ${port}`);
        console.log(`Health check: http://0.0.0.0:${port}/health`);
      });

      return this.httpServer;
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop() {
    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer.close(resolve);
      });
    }
  }
}

// Create and start server if this file is run directly
if (require.main === module) {
  const server = new MCPServer();
  server.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await server.stop();
    process.exit(0);
  });
}

module.exports = MCPServer;
