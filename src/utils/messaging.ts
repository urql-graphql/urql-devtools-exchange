import {
  DevtoolsExchangeIncomingMessage,
  DevtoolsExchangeOutgoingMessage,
  DevtoolsExchangeIncomingEventType,
  DevtoolsExchangeOutgoingEventType,
} from 'types';

export interface Messenger {
  addMessageListener: (
    cb: (m: DevtoolsExchangeIncomingMessage) => void
  ) => void;
  sendMessage: (m: DevtoolsExchangeOutgoingMessage) => void;
}

/** Create curried args for native environment. */
export const createNativeMessenger = (): Messenger => {
  const ws = new WebSocket('ws://localhost:7700');

  ws.onopen = () => console.log('WS connected');
  ws.onclose = () => console.warn('Websocket connection closed');
  ws.onerror = (err) => console.warn('Websocket error: ', err);

  return {
    addMessageListener: (cb) => {
      ws.onmessage = (message) => {
        try {
          if (!message.data) {
            return;
          }

          cb(JSON.parse(message.data) as DevtoolsExchangeIncomingMessage);
        } catch (err) {
          console.warn(err);
        }
      };
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
