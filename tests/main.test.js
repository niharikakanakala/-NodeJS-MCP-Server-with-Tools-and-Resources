// tests/main.test.js

// Mock the MCP SDK modules before importing anything else
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: class MockServer {
    constructor() {
      this.setRequestHandler = () => {};
      this.connect = () => {};
    }
  }
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: class MockStdioServerTransport {
    constructor() {}
  }
}));

// Import modules after mocking
import createServer from '../src/server.js';
import toolsHandler from '../src/handlers/tools.js';
import resourcesHandler from '../src/handlers/resources.js';
import dataService from '../src/services/dataService.js';

describe('MCP Server Complete Test Suite', () => {
  let server;

  beforeEach(() => {
    server = createServer();
    jest.clearAllMocks();
  });

  // ===== BASIC FUNCTIONALITY TESTS =====
  describe('Server Creation and Configuration', () => {
    test('should create server with correct configuration', () => {
      expect(server).toBeDefined();
      expect(server.server).toBeDefined();
      expect(server.getHealth).toBeDefined();
      expect(server.getMcpInfo).toBeDefined();
      expect(server.run).toBeDefined();
    });

    test('should return health status', () => {
      const health = server.getHealth();
      expect(health.status).toBe('healthy');
      expect(health.version).toBe('1.0.0');
      expect(health.timestamp).toBeDefined();
    });

    test('should return MCP info', () => {
      const info = server.getMcpInfo();
      expect(info.name).toBe('real-mcp-server');
      expect(info.version).toBe('1.0.0');
      expect(info.capabilities).toEqual(['tools', 'resources']);
      expect(info.description).toBe('Real Model Context Protocol Server');
    });
  });

  // ===== DATA SERVICE TESTS =====
  describe('Data Service Tests', () => {
    test('should initialize with sample data', () => {
      const users = dataService.list('user');
      const products = dataService.list('product');
      
      expect(users).toHaveLength(3);
      expect(products).toHaveLength(3);
      expect(users[0]).toMatchObject({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'active'
      });
    });

    test('should create new user', () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        status: 'active'
      };
      
      const newUser = dataService.create('user', userData);
      
      expect(newUser.id).toBeDefined();
      expect(newUser.name).toBe(userData.name);
      expect(newUser.email).toBe(userData.email);
      expect(newUser.createdAt).toBeDefined();
      expect(newUser.updatedAt).toBeDefined();
    });

    test('should read existing user', () => {
      const user = dataService.read('user', '1');
      
      expect(user).toBeDefined();
      expect(user.id).toBe('1');
      expect(user.name).toBe('John Doe');
    });

    test('should return null for non-existent user', () => {
      const user = dataService.read('user', 'non-existent');
      expect(user).toBeNull();
    });

    test('should update existing user', () => {
      const updateData = { name: 'Updated Name' };
      const updatedUser = dataService.update('user', '1', updateData);
      
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.email).toBe('john@example.com');
      expect(updatedUser.updatedAt).toBeDefined();
    });

    test('should delete existing user', () => {
      const result = dataService.delete('user', '1');
      
      expect(result.id).toBe('1');
      expect(result.deleted).toBe(true);
      
      const deletedUser = dataService.read('user', '1');
      expect(deletedUser).toBeNull();
    });

    test('should get user statistics', () => {
      const stats = dataService.getStats('user');
      
      expect(stats.type).toBe('user');
      expect(stats.total).toBe(3);
      expect(stats.createdToday).toBeDefined();
    });

    test('should throw error for invalid data type', () => {
      expect(() => dataService.create('invalid', {})).toThrow('Invalid data type: invalid');
      expect(() => dataService.read('invalid', '1')).toThrow('Invalid data type: invalid');
      expect(() => dataService.update('invalid', '1', {})).toThrow('Invalid data type: invalid');
      expect(() => dataService.delete('invalid', '1')).toThrow('Invalid data type: invalid');
      expect(() => dataService.list('invalid')).toThrow('Invalid data type: invalid');
    });
  });

  // ===== TOOLS HANDLER TESTS =====
  describe('Tools Handler Tests', () => {
    test('should list available tools', async () => {
      const result = await toolsHandler.listTools();
      
      expect(result.tools).toHaveLength(2);
      expect(result.tools[0].name).toBe('calculate');
      expect(result.tools[1].name).toBe('manage_data');
    });

    // Calculate Tool Tests
    describe('Calculate Tool', () => {
      test('should perform addition', async () => {
        const request = {
          name: 'calculate',
          arguments: { operation: 'add', a: 5, b: 3 }
        };
        
        const result = await toolsHandler.callTool(request);
        const content = JSON.parse(result.content[0].text);
        
        expect(content.operation).toBe('add');
        expect(content.result).toBe(8);
        expect(content.operands).toEqual({ a: 5, b: 3 });
      });

      test('should perform subtraction', async () => {
        const request = {
          name: 'calculate',
          arguments: { operation: 'subtract', a: 10, b: 4 }
        };
        
        const result = await toolsHandler.callTool(request);
        const content = JSON.parse(result.content[0].text);
        
        expect(content.result).toBe(6);
      });

      test('should perform multiplication', async () => {
        const request = {
          name: 'calculate',
          arguments: { operation: 'multiply', a: 6, b: 7 }
        };
        
        const result = await toolsHandler.callTool(request);
        const content = JSON.parse(result.content[0].text);
        
        expect(content.result).toBe(42);
      });

      test('should perform division', async () => {
        const request = {
          name: 'calculate',
          arguments: { operation: 'divide', a: 15, b: 3 }
        };
        
        const result = await toolsHandler.callTool(request);
        const content = JSON.parse(result.content[0].text);
        
        expect(content.result).toBe(5);
      });

      test('should throw error for division by zero', async () => {
        const request = {
          name: 'calculate',
          arguments: { operation: 'divide', a: 10, b: 0 }
        };
        
        await expect(toolsHandler.callTool(request)).rejects.toThrow('Division by zero is not allowed');
      });

      test('should throw error for invalid operation', async () => {
        const request = {
          name: 'calculate',
          arguments: { operation: 'invalid', a: 5, b: 3 }
        };
        
        await expect(toolsHandler.callTool(request)).rejects.toThrow('Invalid operation');
      });

      test('should throw error for non-numeric inputs', async () => {
        const request = {
          name: 'calculate',
          arguments: { operation: 'add', a: 'not a number', b: 3 }
        };
        
        await expect(toolsHandler.callTool(request)).rejects.toThrow('Both a and b must be numbers');
      });
    });

    // Data Management Tool Tests
    describe('Data Management Tool', () => {
      test('should create new user via tool', async () => {
        const request = {
          name: 'manage_data',
          arguments: {
            action: 'create',
            type: 'user',
            data: { name: 'Tool User', email: 'tool@example.com' }
          }
        };
        
        const result = await toolsHandler.callTool(request);
        const content = JSON.parse(result.content[0].text);
        
        expect(content.success).toBe(true);
        expect(content.data.name).toBe('Tool User');
        expect(content.data.id).toBeDefined();
      });

      test('should read user via tool', async () => {
        const request = {
          name: 'manage_data',
          arguments: {
            action: 'read',
            type: 'user',
            id: '1'
          }
        };
        
        const result = await toolsHandler.callTool(request);
        const content = JSON.parse(result.content[0].text);
        
        expect(content.success).toBe(true);
        expect(content.data.name).toBe('John Doe');
      });

      test('should update user via tool', async () => {
        const request = {
          name: 'manage_data',
          arguments: {
            action: 'update',
            type: 'user',
            id: '1',
            data: { name: 'Updated via Tool' }
          }
        };
        
        const result = await toolsHandler.callTool(request);
        const content = JSON.parse(result.content[0].text);
        
        expect(content.success).toBe(true);
        expect(content.data.name).toBe('Updated via Tool');
      });

      test('should delete user via tool', async () => {
        const request = {
          name: 'manage_data',
          arguments: {
            action: 'delete',
            type: 'user',
            id: '2'
          }
        };
        
        const result = await toolsHandler.callTool(request);
        const content = JSON.parse(result.content[0].text);
        
        expect(content.success).toBe(true);
        expect(content.data.deleted).toBe(true);
      });

      test('should list users via tool', async () => {
        const request = {
          name: 'manage_data',
          arguments: {
            action: 'list',
            type: 'user'
          }
        };
        
        const result = await toolsHandler.callTool(request);
        const content = JSON.parse(result.content[0].text);
        
        expect(content.success).toBe(true);
        expect(Array.isArray(content.data)).toBe(true);
      });

      test('should handle errors gracefully', async () => {
        const request = {
          name: 'manage_data',
          arguments: {
            action: 'read',
            type: 'user',
            id: 'non-existent'
          }
        };
        
        const result = await toolsHandler.callTool(request);
        const content = JSON.parse(result.content[0].text);
        
        expect(content.success).toBe(false);
        expect(content.error).toBeDefined();
      });

      test('should validate required fields', async () => {
        const request = {
          name: 'manage_data',
          arguments: {
            action: 'create',
            type: 'user'
          }
        };
        
        const result = await toolsHandler.callTool(request);
        const content = JSON.parse(result.content[0].text);
        
        expect(content.success).toBe(false);
        expect(content.error).toContain('Data is required for create action');
      });
    });

    test('should throw error for unknown tool', async () => {
      const request = {
        name: 'unknown_tool',
        arguments: {}
      };
      
      await expect(toolsHandler.callTool(request)).rejects.toThrow('Unknown tool: unknown_tool');
    });
  });

  // ===== RESOURCES HANDLER TESTS =====
  describe('Resources Handler Tests', () => {
    test('should list available resources', async () => {
      const result = await resourcesHandler.listResources();
      
      expect(result.resources).toHaveLength(4);
      expect(result.resources.map(r => r.uri)).toEqual([
        'users://all',
        'products://all',
        'users://stats',
        'products://stats'
      ]);
    });

    test('should read users resource', async () => {
      const request = { uri: 'users://all' };
      const result = await resourcesHandler.readResource(request);
      
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('users://all');
      expect(result.contents[0].mimeType).toBe('application/json');
      
      const content = JSON.parse(result.contents[0].text);
      expect(content.type).toBe('users');
      expect(content.count).toBe(3);
      expect(Array.isArray(content.data)).toBe(true);
    });

    test('should read products resource', async () => {
      const request = { uri: 'products://all' };
      const result = await resourcesHandler.readResource(request);
      
      const content = JSON.parse(result.contents[0].text);
      expect(content.type).toBe('products');
      expect(content.count).toBe(3);
      expect(content.totalValue).toBeDefined();
    });

    test('should read user statistics resource', async () => {
      const request = { uri: 'users://stats' };
      const result = await resourcesHandler.readResource(request);
      
      const content = JSON.parse(result.contents[0].text);
      expect(content.type).toBe('user_statistics');
      expect(content.total).toBe(3);
    });

    test('should read product statistics resource', async () => {
      const request = { uri: 'products://stats' };
      const result = await resourcesHandler.readResource(request);
      
      const content = JSON.parse(result.contents[0].text);
      expect(content.type).toBe('product_statistics');
      expect(content.total).toBe(3);
    });

    test('should throw error for non-existent resource', async () => {
      const request = { uri: 'invalid://resource' };
      
      await expect(resourcesHandler.readResource(request)).rejects.toThrow('Resource "invalid://resource" not found');
    });
  });

  // ===== PERFORMANCE TESTS =====
  describe('Performance Tests', () => {
    test('should handle multiple calculations quickly', async () => {
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const request = {
          name: 'calculate',
          arguments: { operation: 'add', a: i, b: i + 1 }
        };
        promises.push(toolsHandler.callTool(request));
      }
      
      await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000);
    });

    test('should handle multiple data operations efficiently', async () => {
      const startTime = Date.now();
      
      const createPromises = [];
      for (let i = 0; i < 50; i++) {
        const request = {
          name: 'manage_data',
          arguments: {
            action: 'create',
            type: 'user',
            data: { name: `User ${i}`, email: `user${i}@test.com` }
          }
        };
        createPromises.push(toolsHandler.callTool(request));
      }
      
      await Promise.all(createPromises);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000);
    });

    test('should list resources quickly', async () => {
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(resourcesHandler.listResources());
      }
      
      await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(500);
    });

    test('should handle large dataset operations', () => {
      const startTime = Date.now();
      
      const userIds = [];
      for (let i = 0; i < 1000; i++) {
        const user = dataService.create('user', {
          name: `User ${i}`,
          email: `user${i}@test.com`,
          status: 'active'
        });
        userIds.push(user.id);
      }
      
      const users = dataService.list('user');
      expect(users.length).toBeGreaterThan(1000);
      
      for (let i = 0; i < 100; i++) {
        dataService.update('user', userIds[i], { status: 'inactive' });
      }
      
      for (let i = 0; i < 50; i++) {
        dataService.delete('user', userIds[i]);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000);
    });
  });

  // ===== EDGE CASES AND BOUNDARY TESTS =====
  describe('Edge Cases and Boundary Tests', () => {
    test('should handle very large numbers in calculations', async () => {
      const request = {
        name: 'calculate',
        arguments: { operation: 'add', a: 999999999, b: 999999999 }
      };
      
      const result = await toolsHandler.callTool(request);
      const content = JSON.parse(result.content[0].text);
      
      expect(content.result).toBe(1999999998);
    });

    test('should handle very small numbers in calculations', async () => {
      const request = {
        name: 'calculate',
        arguments: { operation: 'divide', a: 1, b: 1000000 }
      };
      
      const result = await toolsHandler.callTool(request);
      const content = JSON.parse(result.content[0].text);
      
      expect(content.result).toBe(0.000001);
    });

    test('should handle negative numbers', async () => {
      const request = {
        name: 'calculate',
        arguments: { operation: 'multiply', a: -5, b: 3 }
      };
      
      const result = await toolsHandler.callTool(request);
      const content = JSON.parse(result.content[0].text);
      
      expect(content.result).toBe(-15);
    });

    test('should handle floating point precision', async () => {
      const request = {
        name: 'calculate',
        arguments: { operation: 'add', a: 0.1, b: 0.2 }
      };
      
      const result = await toolsHandler.callTool(request);
      const content = JSON.parse(result.content[0].text);
      
      expect(content.result).toBeCloseTo(0.3);
    });

    test('should handle empty data creation', async () => {
      const request = {
        name: 'manage_data',
        arguments: {
          action: 'create',
          type: 'user',
          data: {}
        }
      };
      
      const result = await toolsHandler.callTool(request);
      const content = JSON.parse(result.content[0].text);
      
      expect(content.success).toBe(true);
      expect(content.data.id).toBeDefined();
    });

    test('should handle special characters in data', async () => {
      const specialData = {
        name: 'User with 特殊字符 and émojis 🚀',
        email: 'special@tëst.com',
        description: 'Contains "quotes" and \'apostrophes\' and newlines\n\nMultiple lines'
      };
      
      const request = {
        name: 'manage_data',
        arguments: {
          action: 'create',
          type: 'user',
          data: specialData
        }
      };
      
      const result = await toolsHandler.callTool(request);
      const content = JSON.parse(result.content[0].text);
      
      expect(content.success).toBe(true);
      expect(content.data.name).toBe(specialData.name);
    });

    test('should handle null and undefined values', async () => {
      const request = {
        name: 'manage_data',
        arguments: {
          action: 'create',
          type: 'user',
          data: { name: null, email: undefined, status: 'active' }
        }
      };
      
      const result = await toolsHandler.callTool(request);
      const content = JSON.parse(result.content[0].text);
      
      expect(content.success).toBe(true);
      expect(content.data.name).toBe(null);
    });

    test('should handle malformed resource URI', async () => {
      const request = { uri: 'malformed://' };
      
      await expect(resourcesHandler.readResource(request)).rejects.toThrow();
    });

    test('should handle empty resource URI', async () => {
      const request = { uri: '' };
      
      await expect(resourcesHandler.readResource(request)).rejects.toThrow();
    });
  });

  // ===== INTEGRATION TESTS =====
  describe('Integration Tests', () => {
    test('should handle complete user lifecycle', async () => {
      // Create user
      const createRequest = {
        name: 'manage_data',
        arguments: {
          action: 'create',
          type: 'user',
          data: { name: 'Integration User', email: 'integration@test.com' }
        }
      };
      
      const createResult = await toolsHandler.callTool(createRequest);
      const createContent = JSON.parse(createResult.content[0].text);
      const userId = createContent.data.id;
      
      // Read user
      const readRequest = {
        name: 'manage_data',
        arguments: {
          action: 'read',
          type: 'user',
          id: userId
        }
      };
      
      const readResult = await toolsHandler.callTool(readRequest);
      const readContent = JSON.parse(readResult.content[0].text);
      
      expect(readContent.success).toBe(true);
      expect(readContent.data.name).toBe('Integration User');
      
      // Update user
      const updateRequest = {
        name: 'manage_data',
        arguments: {
          action: 'update',
          type: 'user',
          id: userId,
          data: { name: 'Updated Integration User' }
        }
      };
      
      const updateResult = await toolsHandler.callTool(updateRequest);
      const updateContent = JSON.parse(updateResult.content[0].text);
      
      expect(updateContent.success).toBe(true);
      expect(updateContent.data.name).toBe('Updated Integration User');
      
      // Delete user
      const deleteRequest = {
        name: 'manage_data',
        arguments: {
          action: 'delete',
          type: 'user',
          id: userId
        }
      };
      
      const deleteResult = await toolsHandler.callTool(deleteRequest);
      const deleteContent = JSON.parse(deleteResult.content[0].text);
      
      expect(deleteContent.success).toBe(true);
      expect(deleteContent.data.deleted).toBe(true);
    });

    test('should handle mathematical operations sequence', async () => {
      const operations = [
        { operation: 'add', a: 10, b: 5, expected: 15 },
        { operation: 'subtract', a: 20, b: 8, expected: 12 },
        { operation: 'multiply', a: 6, b: 4, expected: 24 },
        { operation: 'divide', a: 100, b: 5, expected: 20 }
      ];
      
      for (const op of operations) {
        const request = {
          name: 'calculate',
          arguments: { operation: op.operation, a: op.a, b: op.b }
        };
        
        const result = await toolsHandler.callTool(request);
        const content = JSON.parse(result.content[0].text);
        
        expect(content.result).toBe(op.expected);
      }
    });

    test('should handle concurrent operations', async () => {
      const promises = [];
      
      // Mix of different operations
      for (let i = 0; i < 20; i++) {
        // Add calculations
        promises.push(toolsHandler.callTool({
          name: 'calculate',
          arguments: { operation: 'add', a: i, b: i + 1 }
        }));
        
        // Add data operations
        promises.push(toolsHandler.callTool({
          name: 'manage_data',
          arguments: {
            action: 'create',
            type: 'user',
            data: { name: `Concurrent User ${i}`, email: `concurrent${i}@test.com` }
          }
        }));
        
        // Add resource reads
        promises.push(resourcesHandler.readResource({ uri: 'users://all' }));
      }
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(60);
      
      // Verify all operations completed successfully
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        if (result.content) {
          const content = JSON.parse(result.content[0].text);
          expect(content).toBeDefined();
        }
      });
    });
  });

  // ===== ERROR HANDLING TESTS =====
  describe('Error Handling Tests', () => {
    test('should handle invalid tool requests gracefully', async () => {
      const invalidRequests = [
        { name: 'calculate', arguments: { operation: 'invalid' } },
        { name: 'manage_data', arguments: { action: 'invalid' } },
        { name: 'non_existent_tool', arguments: {} }
      ];
      
      for (const request of invalidRequests) {
        await expect(toolsHandler.callTool(request)).rejects.toThrow();
      }
    });

    test('should handle data service errors', () => {
      expect(() => dataService.update('user', 'non-existent', {})).toThrow();
      expect(() => dataService.delete('user', 'non-existent')).toThrow();
    });

    test('should handle missing required parameters', async () => {
      const incompleteRequests = [
        { name: 'calculate', arguments: { operation: 'add', a: 5 } }, // Missing b
        { name: 'manage_data', arguments: { action: 'read' } }, // Missing type
        { name: 'manage_data', arguments: { action: 'create', type: 'user' } } // Missing data
      ];
      
      for (const request of incompleteRequests) {
        await expect(toolsHandler.callTool(request)).rejects.toThrow();
      }
    });

    test('should handle type validation errors', async () => {
      const typeErrorRequests = [
        { name: 'calculate', arguments: { operation: 'add', a: 'string', b: 5 } },
        { name: 'manage_data', arguments: { action: 'create', type: 'invalid_type', data: {} } }
      ];
      
      for (const request of typeErrorRequests) {
        await expect(toolsHandler.callTool(request)).rejects.toThrow();
      }
    });
  });

  // ===== STRESS TESTS =====
  describe('Stress Tests', () => {
    test('should handle memory-intensive operations', () => {
      const ids = [];
      
      // Create large objects
      for (let i = 0; i < 1000; i++) {
        const user = dataService.create('user', { 
          name: `User ${i}`,
          largeData: new Array(1000).fill('x').join('')
        });
        ids.push(user.id);
      }
      
      // Verify all created
      expect(ids).toHaveLength(1000);
      
      // Clean up half
      for (let i = 0; i < 500; i++) {
        dataService.delete('user', ids[i]);
      }
      
      // Verify cleanup
      const remaining = dataService.list('user');
      expect(remaining.length).toBeGreaterThan(500);
    });

    test('should handle rapid successive operations', async () => {
      const results = [];
      
      for (let i = 0; i < 100; i++) {
        const result = await toolsHandler.callTool({
          name: 'calculate',
          arguments: { operation: 'add', a: i, b: 1 }
        });
        results.push(result);
      }
      
      expect(results).toHaveLength(100);
      
      // Verify all results are correct
      results.forEach((result, index) => {
        const content = JSON.parse(result.content[0].text);
        expect(content.result).toBe(index + 1);
      });
    });
  });
});