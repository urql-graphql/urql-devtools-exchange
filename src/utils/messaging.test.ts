import { createBrowserMessenger, createNativeMessenger } from './messaging';
let instance: any = {};
const WebSocket = jest.fn(function () {
  instance = {};
  return instance;
});

(global as any).WebSocket = jest.fn(WebSocket);

beforeEach(jest.clearAllMocks);

beforeAll(() => {
  jest.useFakeTimers();
});

describe('on create native messenger', () => {
  it('creates a new websocket connection', () => {
    createNativeMessenger();
    jest.runAllTimers();
    expect(WebSocket).toBeCalledTimes(1);
    expect(WebSocket.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "ws://localhost:7700",
      ]
    `);
  });

  describe('on close', () => {
    it('tries to establish a new connection', () => {
      createNativeMessenger();
      instance.onclose();
      jest.runAllTimers();
      expect(WebSocket).toBeCalledTimes(2);
    });
  });

  describe('on error', () => {
    it('tries to establish a new connection', () => {
      createNativeMessenger();
      instance.onerror();
      jest.runAllTimers();
      expect(WebSocket).toBeCalledTimes(2);
    });
  });

  describe('on incoming message', () => {
    it('calls all message handlers', () => {
      const data = '{ "test": 1234 }';
      const listeners = [jest.fn(), jest.fn()];

      const m = createNativeMessenger();
      listeners.forEach(m.addMessageListener);
      instance.onmessage({ data });

      listeners.forEach((l) => {
        expect(l).toBeCalledTimes(1);
        expect(l).toBeCalledWith(JSON.parse(data));
      });
    });
  });

  describe('on send message', () => {
    it('sends a websocket message', () => {
      const message = { test: 1234 } as any;

      const m = createNativeMessenger();
      instance.send = jest.fn();
      instance.readyState = instance.OPEN = 1;

      m.sendMessage(message);
      expect(instance.send).toBeCalledWith(JSON.stringify(message));
    });
  });
});

describe('on create browser messenger', () => {
  const addEventListener = jest.spyOn(window, 'addEventListener');
  const postMessage = jest.spyOn(window, 'postMessage');

  describe('on trusted message', () => {
    it('calls message listeners', () => {
      const data = {
        type: 'init',
        source: 'devtools',
        message: { test: 1234 },
      };
      const listener = jest.fn();

      const m = createBrowserMessenger();
      m.addMessageListener(listener);

      const handler = addEventListener.mock.calls[0][1] as any;
      handler({ data, isTrusted: true });

      expect(listener).toBeCalledTimes(1);
      expect(listener).toBeCalledWith(data);
    });
  });

  describe('on untrusted message', () => {
    it('calls message listeners', () => {
      const data = {
        type: 'init',
        source: 'devtools',
        message: { test: 1234 },
      };
      const listener = jest.fn();

      const m = createBrowserMessenger();
      m.addMessageListener(listener);

      const handler = addEventListener.mock.calls[0][1] as any;
      handler({ data, isTrusted: false });

      expect(listener).toBeCalledTimes(0);
    });
  });

  describe('on send message', () => {
    it('calls post message', () => {
      const data = {
        arg: 1234,
        ignoredFunction: () => false,
        someString: 'hello',
      };

      const m = createBrowserMessenger();
      m.sendMessage(data as any);
      expect(postMessage).toBeCalledTimes(1);
      expect(postMessage.mock.calls[0][0]).toMatchInlineSnapshot(`
        Object {
          "arg": 1234,
          "someString": "hello",
        }
      `);
    });
  });
});
