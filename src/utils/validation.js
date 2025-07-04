// Tool validation schemas
const toolSchemas = {
  get_data: {
    required: ['id', 'type'],
    validate: (args) => {
      if (!args.id || typeof args.id !== 'string') return 'id is required and must be a string';
      if (!args.type || !['user', 'product', 'order'].includes(args.type)) return 'type must be user, product, or order';
      return null;
    }
  },
  
  create_data: {
    required: ['type', 'data'],
    validate: (args) => {
      if (!args.type || !['user', 'product', 'order'].includes(args.type)) return 'type must be user, product, or order';
      if (!args.data || typeof args.data !== 'object') return 'data is required and must be an object';
      return null;
    }
  },
  
  calculate: {
    required: ['operation', 'a', 'b'],
    validate: (args) => {
      if (!args.operation || !['add', 'subtract', 'multiply', 'divide'].includes(args.operation)) return 'operation must be add, subtract, multiply, or divide';
      if (typeof args.a !== 'number') return 'a must be a number';
      if (typeof args.b !== 'number') return 'b must be a number';
      return null;
    }
  }
};

// Data validation schemas
const dataSchemas = {
  user: {
    validate: (data) => {
      if (!data.name || typeof data.name !== 'string' || data.name.length < 1) return 'name is required';
      if (!data.email || !isValidEmail(data.email)) return 'valid email is required';
      if (data.status && !['active', 'inactive'].includes(data.status)) return 'status must be active or inactive';
      return null;
    }
  },
  
  product: {
    validate: (data) => {
      if (!data.name || typeof data.name !== 'string' || data.name.length < 1) return 'name is required';
      if (typeof data.price !== 'number' || data.price <= 0) return 'price must be a positive number';
      if (!data.category || typeof data.category !== 'string') return 'category is required';
      if (data.stock && (typeof data.stock !== 'number' || data.stock < 0)) return 'stock must be a non-negative number';
      return null;
    }
  },
  
  order: {
    validate: (data) => {
      if (!data.userId || typeof data.userId !== 'string') return 'userId is required';
      if (!data.productId || typeof data.productId !== 'string') return 'productId is required';
      if (typeof data.quantity !== 'number' || data.quantity <= 0) return 'quantity must be a positive number';
      if (typeof data.total !== 'number' || data.total <= 0) return 'total must be a positive number';
      if (data.status && !['pending', 'completed', 'shipped', 'cancelled'].includes(data.status)) return 'invalid status';
      return null;
    }
  }
};

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

class ValidationUtils {
  validateToolCall(toolName, args) {
    try {
      const schema = toolSchemas[toolName];
      if (!schema) {
        return {
          isValid: false,
          error: `Unknown tool: ${toolName}`
        };
      }

      const error = schema.validate(args);
      if (error) {
        return {
          isValid: false,
          error: `Invalid arguments for tool ${toolName}: ${error}`
        };
      }

      return { isValid: true };
    } catch (err) {
      return {
        isValid: false,
        error: `Validation error: ${err.message}`
      };
    }
  }

  validateData(type, data) {
    try {
      const schema = dataSchemas[type];
      if (!schema) {
        return {
          isValid: false,
          error: `Unknown data type: ${type}`
        };
      }

      const error = schema.validate(data);
      if (error) {
        return {
          isValid: false,
          error: `Invalid data for type ${type}: ${error}`
        };
      }

      return { 
        isValid: true, 
        validatedData: data 
      };
    } catch (err) {
      return {
        isValid: false,
        error: `Validation error: ${err.message}`
      };
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = new ValidationUtils();