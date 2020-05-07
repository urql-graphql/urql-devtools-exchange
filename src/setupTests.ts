global.window = {
  addEventListener: jest.fn(),
  postMessage: jest.fn(),
};
(global as any).__pkg_version__ = '200.0.0';
