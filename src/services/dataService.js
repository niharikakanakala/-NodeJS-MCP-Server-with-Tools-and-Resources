import { v4 as uuidv4 } from 'uuid';

class DataService {
  constructor() {
    this.data = {
      user: new Map(),
      product: new Map()
    };
    
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
      { id: '2', name: 'Mouse', price: 29.99, category: 'Electronics', stock: 200 },
      { id: '3', name: 'Keyboard', price: 79.99, category: 'Electronics', stock: 150 }
    ];

    // Store sample data
    users.forEach(user => {
      this.data.user.set(user.id, { ...user, createdAt: new Date() });
    });
    
    products.forEach(product => {
      this.data.product.set(product.id, { ...product, createdAt: new Date() });
    });
  }

  create(type, data) {
    if (!this.data[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }

    const id = uuidv4();
    const newItem = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.data[type].set(id, newItem);
    return newItem;
  }

  read(type, id) {
    if (!this.data[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }

    return this.data[type].get(id) || null;
  }

  update(type, id, data) {
    if (!this.data[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }

    const existing = this.data[type].get(id);
    if (!existing) {
      throw new Error(`${type} with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };

    this.data[type].set(id, updated);
    return updated;
  }

  delete(type, id) {
    if (!this.data[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }

    const existing = this.data[type].get(id);
    if (!existing) {
      throw new Error(`${type} with id ${id} not found`);
    }

    this.data[type].delete(id);
    return { id, deleted: true };
  }

  list(type) {
    if (!this.data[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }

    return Array.from(this.data[type].values());
  }

  getStats(type) {
    if (!this.data[type]) {
      throw new Error(`Invalid data type: ${type}`);
    }

    const items = Array.from(this.data[type].values());
    return {
      type,
      total: items.length,
      createdToday: items.filter(item => {
        const created = new Date(item.createdAt);
        const today = new Date();
        return created.toDateString() === today.toDateString();
      }).length
    };
  }
}

export default new DataService();