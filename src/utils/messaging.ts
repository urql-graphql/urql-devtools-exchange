import {
  DevtoolsExchangeIncomingMessage,
  DevtoolsExchangeOutgoingMessage,
  DevtoolsExchangeIncomingEventType,
  DevtoolsExchangeOutgoingEventType,
} from '../types';

export interface Messenger {
  addMessageListener: (
    cb: (m: DevtoolsExchangeIncomingMessage) => void
  ) => void;
  sendMessage: (m: DevtoolsExchangeOutgoingMessage) => void;
}

/** Create curried args for native environment. */
export const createNativeMessenger = (): Messenger => {
  let listeners: Function[] = [];
  let ws: WebSocket;
  let timeout: NodeJS.Timeout | undefined;

  const createConnection = () => {
    timeout = undefined;
    ws = new WebSocket('ws://localhost:7700');

    ws.onclose = () => {
      timeout = timeout || setTimeout(createConnection, 500);
    };
    ws.onerror = () => {
      timeout = timeout || setTimeout(createConnection, 500);
    };
    ws.onmessage = (message) => {
      try {
        if (!message.data) {
          return;
        }

        listeners.forEach((l) =>
          l(JSON.parse(message.data) as DevtoolsExchangeIncomingMessage)
        );
      } catch (err) {
        console.warn(err);
      }
    };
  };
  createConnection();

  return {
    addMessageListener: (cb) => {
      listeners = [...listeners, cb];
    },
    sendMessage: (message) => {
      ws.readyState === ws.OPEN && ws.send(JSON.stringify(message));
    },
  };
};

/** Create curried args for browser environment. */
export const createBrowserMessenger = (): Messenger => ({
  addMessageListener: (cb) => {
    window.addEventListener('message', ({ data, isTrusted }) => {
      if (!isTrusted || data?.type !== DevtoolsExchangeIncomingEventType) {
        return;
      }

      cb(data.message as DevtoolsExchangeIncomingMessage);
    });
  },
  sendMessage: (message) => {
    window.postMessage(
      {
        type: DevtoolsExchangeOutgoingEventType,
        message: JSON.parse(JSON.stringify(message)),
      },
      window.location.origin
    );
  },
});
