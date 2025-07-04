const { v4: uuidv4 } = require('uuid');

class DataService {
  constructor() {
    // In-memory data store for demo purposes
    this.data = {
      user: new Map(),
      product: new Map(),
      order: new Map()
    };
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  initializeSampleData() {
    // Sample users
    const users = [
      { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'active' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'inactive' }
    ];

    // Sample products
    const products = [
      { id: '1', name: 'Laptop', price: 999.99, category: 'Electronics', stock: 50 },
      { id: '2', name: 'Smartphone', price: 699.99, category: 'Electronics', stock: 100 },
      { id: '3', name: 'Desk Chair', price: 249.99, category: 'Furniture', stock: 25 }
    ];

    // Sample orders
    const orders = [
      { id: '1', userId: '1', productId: '1', quantity: 1, total: 999.99, status: 'completed' },
      { id: '2', userId: '2', productId: '2', quantity: 2, total: 1399.98, status: 'pending' },
      { id: '3', userId: '1', productId: '3', quantity: 1, total: 249.99, status: 'shipped' }
    ];

    // Store sample data
    users.forEach(user => this.data.user.set(user.id, { ...user, createdAt: new Date() }));
    products.forEach(product => this.data.product.set(product.id, { ...product, createdAt: new Date() }));
    orders.forEach(order => this.data.order.set(order.id, { ...order, createdAt: new Date() }));
  }

  async getData(id, type) {
    if (!this.data[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }
    
    return this.data[type].get(id) || null;
  }

  async getAllData(type) {
    if (!this.data[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }
    
    return Array.from(this.data[type].values());
  }

  async createData(type, data) {
    if (!this.data[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }

    const id = uuidv4();
    const newData = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.data[type].set(id, newData);
    return newData;
  }

  async updateData(id, type, data) {
    if (!this.data[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }

    const existing = this.data[type].get(id);
    if (!existing) {
      throw new Error(`${type} with id ${id} not found`);
    }

    const updatedData = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };

    this.data[type].set(id, updatedData);
    return updatedData;
  }

  async deleteData(id, type) {
    if (!this.data[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }

    const existing = this.data[type].get(id);
    if (!existing) {
      throw new Error(`${type} with id ${id} not found`);
    }

    this.data[type].delete(id);
    return true;
  }

  async searchData(type, query) {
    if (!this.data[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }

    const allData = Array.from(this.data[type].values());
    
    if (!query) {
      return allData;
    }

    // Simple search implementation
    return allData.filter(item => {
      return Object.values(item).some(value => 
        String(value).toLowerCase().includes(query.toLowerCase())
      );
    });
  }

  async getStats(type) {
    if (!this.data[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }

    const allData = Array.from(this.data[type].values());
    
    return {
      type,
      total: allData.length,
      created: allData.filter(item => {
        const created = new Date(item.createdAt);
        const today = new Date();
        return created.toDateString() === today.toDateString();
      }).length,
      lastUpdated: allData.length > 0 ? 
        Math.max(...allData.map(item => new Date(item.updatedAt || item.createdAt))) : 
        null
    };
  }


  clear(type) {
    if (type) {
      this.data[type].clear();
    } else {
      Object.keys(this.data).forEach(key => {
        this.data[key].clear();
      });
    }
  }

  getDataStore() {
    return this.data;
  }
}

module.exports = new DataService();