import dataService from '../services/dataService.js';

const AVAILABLE_TOOLS = [
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
  },
  {
    name: 'manage_data',
    description: 'Manage user and product data',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'read', 'update', 'delete', 'list'],
          description: 'The action to perform'
        },
        type: {
          type: 'string',
          enum: ['user', 'product'],
          description: 'The type of data'
        },
        id: {
          type: 'string',
          description: 'ID for read/update/delete operations'
        },
        data: {
          type: 'object',
          description: 'Data for create/update operations'
        }
      },
      required: ['action', 'type']
    }
  }
];

class ToolsHandler {
  async listTools() {
    return {
      tools: AVAILABLE_TOOLS
    };
  }

  async callTool(request) {
    const { name, arguments: args } = request;

    switch (name) {
      case 'calculate':
        return this.handleCalculate(args);
      case 'manage_data':
        return this.handleDataManagement(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  handleCalculate(args) {
    const { operation, a, b } = args;

    // Validate inputs
    if (!operation || !['add', 'subtract', 'multiply', 'divide'].includes(operation)) {
      throw new Error('Invalid operation. Must be add, subtract, multiply, or divide');
    }

    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Both a and b must be numbers');
    }

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
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            operation,
            operands: { a, b },
            result,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  handleDataManagement(args) {
    const { action, type, id, data } = args;

    // Validate inputs
    if (!action || !['create', 'read', 'update', 'delete', 'list'].includes(action)) {
      throw new Error('Invalid action. Must be create, read, update, delete, or list');
    }

    if (!type || !['user', 'product'].includes(type)) {
      throw new Error('Invalid type. Must be user or product');
    }

    let result;

    try {
      switch (action) {
        case 'create':
          if (!data) {
            throw new Error('Data is required for create action');
          }
          result = dataService.create(type, data);
          break;

        case 'read':
          if (!id) {
            throw new Error('ID is required for read action');
          }
          result = dataService.read(type, id);
          if (!result) {
            throw new Error(`${type} with id ${id} not found`);
          }
          break;

        case 'update':
          if (!id || !data) {
            throw new Error('ID and data are required for update action');
          }
          result = dataService.update(type, id, data);
          break;

        case 'delete':
          if (!id) {
            throw new Error('ID is required for delete action');
          }
          result = dataService.delete(type, id);
          break;

        case 'list':
          result = dataService.list(type);
          break;
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              action,
              type,
              success: true,
              data: result,
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };

    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              action,
              type,
              success: false,
              error: error.message,
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }
  }
}

export default new ToolsHandler();