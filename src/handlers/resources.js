const dataService = require('../services/dataService');

const AVAILABLE_RESOURCES = [
  {
    uri: 'mcp://data/users',
    name: 'Users Data',
    description: 'Access to user data in the system',
    mimeType: 'application/json'
  },
  {
    uri: 'mcp://data/products',
    name: 'Products Data',
    description: 'Access to product catalog data',
    mimeType: 'application/json'
  },
  {
    uri: 'mcp://data/orders',
    name: 'Orders Data',
    description: 'Access to order history data',
    mimeType: 'application/json'
  },
  {
    uri: 'mcp://config/settings',
    name: 'System Settings',
    description: 'Application configuration settings',
    mimeType: 'application/json'
  }
];

class ResourcesHandler {
  async listResources() {
    try {
      return {
        resources: AVAILABLE_RESOURCES
      };
    } catch (error) {
      throw new Error(`Failed to list resources: ${error.message}`);
    }
  }

  async readResource(request) {
    try {
      const { uri } = request;
      
      // Find the resource
      const resource = AVAILABLE_RESOURCES.find(r => r.uri === uri);
      if (!resource) {
        throw new Error(`Resource "${uri}" not found`);
      }

      // Read the resource content
      let content;
      switch (uri) {
        case 'mcp://data/users':
          content = await this.readUsersData();
          break;
        case 'mcp://data/products':
          content = await this.readProductsData();
          break;
        case 'mcp://data/orders':
          content = await this.readOrdersData();
          break;
        case 'mcp://config/settings':
          content = await this.readSettings();
          break;
        default:
          throw new Error(`Resource "${uri}" not implemented`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: resource.mimeType,
            text: JSON.stringify(content, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to read resource: ${error.message}`);
    }
  }

  async readUsersData() {
    const users = await dataService.getAllData('user');
    return {
      type: 'users',
      count: users.length,
      data: users,
      lastUpdated: new Date().toISOString()
    };
  }

  async readProductsData() {
    const products = await dataService.getAllData('product');
    return {
      type: 'products',
      count: products.length,
      data: products,
      lastUpdated: new Date().toISOString()
    };
  }

  async readOrdersData() {
    const orders = await dataService.getAllData('order');
    return {
      type: 'orders',
      count: orders.length,
      data: orders,
      lastUpdated: new Date().toISOString()
    };
  }

  async readSettings() {
    return {
      server: {
        name: 'mcp-server',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      features: {
        tools: true,
        resources: true,
        prompts: true
      },
      limits: {
        maxRequestSize: '10mb',
        rateLimit: 1000
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = new ResourcesHandler();