module.exports = {
  createURL: jest.fn((path) => `exp://localhost/${path}`),
  openURL: jest.fn(() => Promise.resolve()),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
  parse: jest.fn((url) => ({ path: url })),
  parseInitialURLAsync: jest.fn(() => Promise.resolve(null)),
};
