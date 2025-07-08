import dataService from '../services/dataService.js';

const AVAILABLE_RESOURCES = [
  {
    uri: 'users://all',
    name: 'All Users',
    description: 'List of all users in the system',
    mimeType: 'application/json'
  },
  {
    uri: 'products://all', 
    name: 'All Products',
    description: 'List of all products in the system',
    mimeType: 'application/json'
  },
  {
    uri: 'users://stats',
    name: 'User Statistics',
    description: 'Statistics about users',
    mimeType: 'application/json'
  },
  {
    uri: 'products://stats',
    name: 'Product Statistics',
    description: 'Statistics about products',
    mimeType: 'application/json'
  }
];

class ResourcesHandler {
  async listResources() {
    return {
      resources: AVAILABLE_RESOURCES
    };
  }

  async readResource(request) {
    const { uri } = request;

    const resource = AVAILABLE_RESOURCES.find(r => r.uri === uri);
    if (!resource) {
      throw new Error(`Resource "${uri}" not found`);
    }

    let content;
    switch (uri) {
      case 'users://all':
        content = this.readUsersData();
        break;
      case 'users://stats':
        content = this.readUsersStats();
        break;
      case 'products://all':
        content = this.readProductsData();
        break;
      case 'products://stats':
        content = this.readProductsStats();
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
  }

  readUsersData() {
    const users = dataService.list('user');
    
    return {
      type: 'users',
      count: users.length,
      data: users,
      lastUpdated: new Date().toISOString()
    };
  }

  readUsersStats() {
    const stats = dataService.getStats('user');
    
    return {
      type: 'user_statistics',
      ...stats,
      lastUpdated: new Date().toISOString()
    };
  }

  readProductsData() {
    const products = dataService.list('product');
    
    return {
      type: 'products',
      count: products.length,
      data: products,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
      lastUpdated: new Date().toISOString()
    };
  }

  readProductsStats() {
    const stats = dataService.getStats('product');
    
    return {
      type: 'product_statistics',
      ...stats,
      lastUpdated: new Date().toISOString()
    };
  }
}

export default new ResourcesHandler();