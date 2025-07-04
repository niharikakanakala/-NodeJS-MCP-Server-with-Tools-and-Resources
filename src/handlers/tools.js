const dataService = require('../services/dataService');
const { validateToolCall } = require('../utils/validation');

const AVAILABLE_TOOLS = [
  {
    name: 'get_data',
    description: 'Retrieve data from the data service',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The ID of the data to retrieve'
        },
        type: {
          type: 'string',
          enum: ['user', 'product', 'order'],
          description: 'The type of data to retrieve'
        }
      },
      required: ['id', 'type']
    }
  },
  {
    name: 'create_data',
    description: 'Create new data in the data service',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['user', 'product', 'order'],
          description: 'The type of data to create'
        },
        data: {
          type: 'object',
          description: 'The data to create'
        }
      },
      required: ['type', 'data']
    }
  },
  {
    name: 'calculate',
    description: 'Perform mathematical calculations',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['add', 'subtract', 'multiply', 'divide'],
          description: 'The mathematical operation to perform'
        },
        a: {
          type: 'number',
          description: 'First number'
        },
        b: {
          type: 'number',
          description: 'Second number'
        }
      },
      required: ['operation', 'a', 'b']
    }
  }
];

class ToolsHandler {
  async listTools() {
    try {
      return {
        tools: AVAILABLE_TOOLS
      };
    } catch (error) {
      throw new Error(`Failed to list tools: ${error.message}`);
    }
  }

  async callTool(request) {
    try {
      const { name, arguments: args } = request;

      // Validate tool call
      const validation = validateToolCall(name, args);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Find the tool
      const tool = AVAILABLE_TOOLS.find(t => t.name === name);
      if (!tool) {
        throw new Error(`Tool "${name}" not found`);
      }

      // Execute the tool
      let result;
      switch (name) {
        case 'get_data':
          result = await this.handleGetData(args);
          break;
        case 'create_data':
          result = await this.handleCreateData(args);
          break;
        case 'calculate':
          result = await this.handleCalculate(args);
          break;
        default:
          throw new Error(`Tool "${name}" not implemented`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  async handleGetData(args) {
    const { id, type } = args;
    const data = await dataService.getData(id, type);
    
    if (!data) {
      return { error: `${type} with id ${id} not found` };
    }
    
    return { success: true, data };
  }

  async handleCreateData(args) {
    const { type, data } = args;
    const result = await dataService.createData(type, data);
    return { success: true, id: result.id, data: result };
  }

  async handleCalculate(args) {
    const { operation, a, b } = args;
    
    let result;
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) {
          throw new Error('Division by zero is not allowed');
        }
        result = a / b;
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    return { 
      operation, 
      operands: { a, b }, 
      result 
    };
  }
}

module.exports = new ToolsHandler();