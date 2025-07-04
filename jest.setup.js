// This runs before Jest loads any modules
const { TextEncoder, TextDecoder } = require('util');

// Set up TextEncoder/TextDecoder globally
Object.assign(global, {
  TextEncoder,
  TextDecoder,
});

// Also set up crypto if needed
if (typeof global.crypto === 'undefined') {
  const crypto = require('crypto');
  Object.defineProperty(global, 'crypto', {
    value: crypto,
    writable: false,
    configurable: false
  });
}

// Additional polyfills that might be needed
if (typeof global.fetch === 'undefined') {
  // Mock fetch if needed
  global.fetch = jest.fn();
}
