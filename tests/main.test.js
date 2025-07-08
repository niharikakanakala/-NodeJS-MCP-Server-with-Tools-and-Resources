// tests/main.test.js

const { spawn } = require('child_process');
const path = require('path');

// Helper function to run Node.js code that can handle ES modules
function runNodeCode(code) {
  return new Promise((resolve, reject) => {
    const nodeProcess = spawn('node', ['--input-type=module'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '..')
    });

    let stdout = '';
    let stderr = '';

    nodeProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    nodeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    nodeProcess.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout.trim()));
        } catch (e) {
          resolve(stdout.trim());
        }
      } else {
        reject(new Error(stderr));
      }
    });

    nodeProcess.stdin.write(code);
    nodeProcess.stdin.end();
  });
}

// Helper function to test server functionality
async function testServerFunction(functionName, ...args) {
  const code = `
    // Mock the MCP SDK modules
    const mockModules = {
      '@modelcontextprotocol/sdk/server/index.js': {
        Server: class MockServer {
          constructor(serverInfo, serverOptions) {
            this.serverInfo = serverInfo;
            this.serverOptions = serverOptions;
          }
          setRequestHandler() {}
          async connect() { return Promise.resolve(); }
        }
      },
      '@modelcontextprotocol/sdk/server/stdio.js': {
        StdioServerTransport: class MockStdioServerTransport {
          constructor() {}
        }
      }
    };

    // Intercept module resolution
    const Module = await import('module');
    const originalResolveFilename = Module.default._resolveFilename;
    Module.default._resolveFilename = function(request, parent, isMain) {
      if (mockModules[request]) {
        return 'mock:' + request;
      }
      return originalResolveFilename.call(this, request, parent, isMain);
    };

    // Set up mocks in cache
    Object.keys(mockModules).forEach(moduleName => {
      Module.default._cache['mock:' + moduleName] = {
        exports: mockModules[moduleName]
      };
    });

    // Import and test the actual modules
    const createServer = (await import('./src/server.js')).default;
    const server = createServer();
    
    let result;
    if ('${functionName}' === 'getHealth') {
      result = server.getHealth();
    } else if ('${functionName}' === 'getMcpInfo') {
      result = server.getMcpInfo();
    } else if ('${functionName}' === 'serverExists') {
      result = { exists: !!server, hasServer: !!server.server, hasRun: typeof server.run === 'function' };
    }
    
    console.log(JSON.stringify(result));
  `;
  
  return await runNodeCode(code);
}

// Helper function to test data service
async function testDataService(method, ...args) {
  const code = `
    const dataService = (await import('./src/services/dataService.js')).default;
    
    let result;
    try {
      if ('${method}' === 'list') {
        result = dataService.list('${args[0]}');
      } else if ('${method}' === 'create') {
        result = dataService.create('${args[0]}', ${JSON.stringify(args[1])});
      } else if ('${method}' === 'read') {
        result = dataService.read('${args[0]}', '${args[1]}');
      } else if ('${method}' === 'update') {
        result = dataService.update('${args[0]}', '${args[1]}', ${JSON.stringify(args[2])});
      } else if ('${method}' === 'delete') {
        result = dataService.delete('${args[0]}', '${args[1]}');
      } else if ('${method}' === 'getStats') {
        result = dataService.getStats('${args[0]}');
      }
      
      console.log(JSON.stringify({ success: true, data: result }));
    } catch (error) {
      console.log(JSON.stringify({ success: false, error: error.message }));
    }
  `;
  
  return await runNodeCode(code);
}

// Helper function to test tools handler
async function testToolsHandler(method, ...args) {
  const code = `
    // Mock the MCP SDK modules
    const mockModules = {
      '@modelcontextprotocol/sdk/server/index.js': {
        Server: class MockServer {
          constructor() { this.handlers = new Map(); }
          setRequestHandler() {}
          async connect() { return Promise.resolve(); }
        }
      },
      '@modelcontextprotocol/sdk/server/stdio.js': {
        StdioServerTransport: class MockStdioServerTransport {}
      }
    };

    const Module = await import('module');
    const originalResolveFilename = Module.default._resolveFilename;
    Module.default._resolveFilename = function(request, parent, isMain) {
      if (mockModules[request]) {
        return 'mock:' + request;
      }
      return originalResolveFilename.call(this, request, parent, isMain);
    };

    Object.keys(mockModules).forEach(moduleName => {
      Module.default._cache['mock:' + moduleName] = {
        exports: mockModules[moduleName]
      };
    });

    const toolsHandler = (await import('./src/handlers/tools.js')).default;
    
    let result;
    try {
      if ('${method}' === 'listTools') {
        result = await toolsHandler.listTools();
      } else if ('${method}' === 'callTool') {
        result = await toolsHandler.callTool(${JSON.stringify(args[0])});
      }
      
      console.log(JSON.stringify({ success: true, data: result }));
    } catch (error) {
      console.log(JSON.stringify({ success: false, error: error.message }));
    }
  `;
  
  return await runNodeCode(code);
}

// Helper function to test resources handler
async function testResourcesHandler(method, ...args) {
  const code = `
    // Mock the MCP SDK modules
    const mockModules = {
      '@modelcontextprotocol/sdk/server/index.js': {
        Server: class MockServer {
          constructor() { this.handlers = new Map(); }
          setRequestHandler() {}
          async connect() { return Promise.resolve(); }
        }
      },
      '@modelcontextprotocol/sdk/server/stdio.js': {
        StdioServerTransport: class MockStdioServerTransport {}
      }
    };

    const Module = await import('module');
    const originalResolveFilename = Module.default._resolveFilename;
    Module.default._resolveFilename = function(request, parent, isMain) {
      if (mockModules[request]) {
        return 'mock:' + request;
      }
      return originalResolveFilename.call(this, request, parent, isMain);
    };

    Object.keys(mockModules).forEach(moduleName => {
      Module.default._cache['mock:' + moduleName] = {
        exports: mockModules[moduleName]
      };
    });

    const resourcesHandler = (await import('./src/handlers/resources.js')).default;
    
    let result;
    try {
      if ('${method}' === 'listResources') {
        result = await resourcesHandler.listResources();
      } else if ('${method}' === 'readResource') {
        result = await resourcesHandler.readResource(${JSON.stringify(args[0])});
      }
      
      console.log(JSON.stringify({ success: true, data: result }));
    } catch (error) {
      console.log(JSON.stringify({ success: false, error: error.message }));
    }
  `;
  
  return await runNodeCode(code);
}

describe('MCP Server Test Suite', () => {
  
  test('should return correct health status', async () => {
    const health = await testServerFunction('getHealth');
    
    expect(health.status).toBe('healthy');
    expect(health.version).toBe('1.0.0');
    expect(health.timestamp).toBeDefined();
  });

  // Test 3: Server MCP Info
  test('should return correct MCP info', async () => {
    const info = await testServerFunction('getMcpInfo');
    
    expect(info.version).toBe('1.0.0');
    expect(info.capabilities).toEqual(['tools', 'resources']);
  });

  // Test 4: Data Service - List Users
  test('should list users from data service', async () => {
    const result = await testDataService('list', 'user');
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'active'
      })
    );
  });

  // Test 5: Data Service - Create User
  test('should create new user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      status: 'active'
    };
    
    const result = await testDataService('create', 'user', userData);
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: userData.name,
        email: userData.email,
        status: userData.status
      })
    );
  });

  // Test 6: Tools Handler - List Tools
  test('should list available tools', async () => {
    const result = await testToolsHandler('listTools');
    
    expect(result.success).toBe(true);
    expect(result.data.tools).toHaveLength(2);
    expect(result.data.tools[0].name).toBe('calculate');
    expect(result.data.tools[1].name).toBe('manage_data');
  });

  // Test 7: Tools Handler - Calculate Addition
  test('should perform addition calculation', async () => {
    const request = {
      name: 'calculate',
      arguments: { operation: 'add', a: 10, b: 5 }
    };
    
    const result = await testToolsHandler('callTool', request);
    
    expect(result.success).toBe(true);
    const content = JSON.parse(result.data.content[0].text);
    expect(content.result).toBe(15);
    expect(content.operation).toBe('add');
    expect(content.operands).toEqual({ a: 10, b: 5 });
  });

  // Test 8: Tools Handler - Division by Zero Error
  test('should throw error for division by zero', async () => {
    const request = {
      name: 'calculate',
      arguments: { operation: 'divide', a: 10, b: 0 }
    };
    
    const result = await testToolsHandler('callTool', request);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Division by zero is not allowed');
  });

  // Test 9: Resources Handler - List Resources
  test('should list available resources', async () => {
    const result = await testResourcesHandler('listResources');
    
    expect(result.success).toBe(true);
    expect(result.data.resources).toHaveLength(4);
    expect(result.data.resources[0].uri).toBe('users://all');
    expect(result.data.resources[1].uri).toBe('products://all');
  });

  // Test 10: Resources Handler - Read Users Resource
  test('should read users resource', async () => {
    const request = { uri: 'users://all' };
    const result = await testResourcesHandler('readResource', request);
    
    expect(result.success).toBe(true);
    expect(result.data.contents).toHaveLength(1);
    expect(result.data.contents[0].uri).toBe('users://all');
    expect(result.data.contents[0].mimeType).toBe('application/json');
    
    const content = JSON.parse(result.data.contents[0].text);
    expect(content.type).toBe('users');
    expect(content.count).toBe(3);
  });
});