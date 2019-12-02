global.window = {
  addEventListener: jest.fn()
};

(global as any).CustomEvent = jest.fn((...args) => ({
  type: args[0],
  ...args[1]
}));
