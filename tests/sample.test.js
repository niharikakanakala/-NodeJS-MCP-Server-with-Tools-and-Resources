if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

const request = require('supertest');
const MCPServer = require('../src/server');
const dataService = require('../src/services/dataService');

describe('MCP Server', () => {
  let server;
  let app;

  beforeAll(async () => {
    server = new MCPServer();
    app = server.app;
  });

  afterAll(async () => {
    if (server.httpServer) {
      await server.stop();
    }
  });

  describe('Health Check', () => {
    test('should return 200 with health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        version: '1.0.0'
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('MCP Info', () => {
    test('should return correct MCP server information', async () => {
      const response = await request(app)
        .get('/mcp/info')
        .expect(200);

      const expected = {
        name: 'mcp-server',
        version: '1.0.0',
        capabilities: ['tools', 'resources'],
      };

      expect(response.body).toEqual(expected);
    });
  });

  describe('Tools', () => {
    test('should list available tools', async () => {
      const response = await request(app)
        .get('/tools/list')
        .expect(200);

      expect(response.body.tools).toBeDefined();
      expect(Array.isArray(response.body.tools)).toBe(true);
      expect(response.body.tools).toHaveLength(3);

      const toolNames = response.body.tools.map(t => t.name);
      const expectedTools = ['get_data', 'create_data', 'calculate'];
      
      expectedTools.forEach(tool => {
        expect(toolNames).toContain(tool);
      });
    });
  
    test('should execute create_data tool', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        status: 'active'
      };

      const response = await request(app)
        .post('/tools/call')
        .send({
          name: 'create_data',
          arguments: {
            type: 'user',
            data: newUser
          }
        });

      if (response.status !== 200) {
        console.log('Create data response:', response.status, response.body);
      }

      expect(response.status).toBe(200);
      const result = JSON.parse(response.body.content[0].text);
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.data.name).toBe(newUser.name);
    });


  });
});