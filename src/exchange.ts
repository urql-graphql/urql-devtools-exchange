import { pipe, tap, take, toPromise } from 'wonka';
import {
  Exchange,
  Client,
  Operation,
  OperationResult,
  DebugEventArg,
  ExchangeIO,
} from '@urql/core';
import {
  DevtoolsExchangeOutgoingMessage,
  DevtoolsExchangeOutgoingEventType,
  ExecuteRequestMessage,
  DevtoolsExchangeIncomingEventType,
  DevtoolsExchangeIncomingMessage,
} from './types';
import { getDisplayName, hash, createDebugMessage } from './utils';
import { parse } from 'graphql';

declare const __pkg_version__: string;

type CurriedArgs = {
  addMessageListener: (
    cb: (m: DevtoolsExchangeIncomingMessage) => void
  ) => void;
  sendMessage: (m: DevtoolsExchangeOutgoingMessage) => void;
};

const curriedDevtoolsExchange = ({
  sendMessage,
  addMessageListener,
}: CurriedArgs): Exchange => ({ client, forward }) => {
  // Listen for messages from content script
  addMessageListener((message) => {
    const handler = messageHandlers[message.type];
    handler && handler(client)(message);
  });

  // Tell the content script we are present
  sendMessage({ type: 'init' });

  // Forward debug events to content script
  client.subscribeToDebugTarget &&
    client.subscribeToDebugTarget((event) =>
      sendMessage({
        type: 'debug',
        data: event,
      })
    );

  return (ops$) =>
    pipe(
      ops$,
      tap(handleOperation({ sendMessage })),
      forward,
      tap(handleResult)
    );
};

type HandlerArgs = {
  sendMessage: CurriedArgs['sendMessage'];
};

/** Handle outgoing operations */
const handleOperation = ({ sendMessage }: HandlerArgs) => (
  operation: Operation
) => {
  if (operation.operationName === 'teardown') {
    const msg = createDebugMessage({
      type: 'teardown',
      message: 'The operation has been torn down',
      operation,
    });

    return sendMessage(msg);
  }

  const msg = createDebugMessage({
    type: 'execution',
    message: 'The client has recieved an execute command.',
    operation,
    data: {
      sourceComponent: getDisplayName(),
    },
  });
  return sendMessage(msg);
};

/** Handle new value or error */
const handleResult = ({ sendMessage }: HandlerArgs) => ({
  operation,
  data,
  error,
}: OperationResult) => {
  if (error) {
    const msg = createDebugMessage({
      type: 'error',
      message: 'The operation has returned a new error.',
      operation,
      data: {
        value: error,
      },
    });
    return sendMessage(msg);
  }

  const msg = createDebugMessage({
    type: 'update',
    message: 'The operation has returned a new response.',
    operation,
    data: {
      value: data,
    },
  });
  sendMessage(msg);
};

/** Handles execute request messages. */
const requestHandler = (client: Client) => (message: ExecuteRequestMessage) => {
  const isMutation = /(^|\W)+mutation\W/.test(message.query);
  const requestType = isMutation ? 'mutation' : 'query';
  const op = client.createRequestOperation(
    requestType,
    {
      key: hash(JSON.stringify(message.query)),
      query: parse(message.query),
    },
    {
      meta: {
        source: 'Devtools',
      },
    }
  );

  pipe(client.executeRequestOperation(op), take(1), toPromise);
};

/** Map of handlers for incoming messages. */
const messageHandlers = {
  request: requestHandler,
} as const;

/** Create curried args for browser environment. */
const createBrowserArgs = (): CurriedArgs => ({
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

/** Create curried args for native environment. */
const createNativeArgs = (): CurriedArgs => {
  const ws = new WebSocket('ws://localhost:7700');

  ws.onclose = () => console.warn('Websocket connection closed');
  ws.onerror = (err) => console.warn('Websocket error: ', err);

  return {
    addMessageListener: (cb) => {
      ws.onmessage = (message) => {
        if (message.data) {
          cb(message.data as DevtoolsExchangeIncomingMessage);
        }
      };
    },
    sendMessage: (message) => ws.send(JSON.parse(JSON.stringify(message))),
  };
};

const createExchange = (): Exchange => {
  const isNative = navigator?.product === 'ReactNative';

  // Prod or SSR
  if (
    process?.env?.NODE_ENV === 'production' ||
    (!isNative && typeof window === undefined)
  ) {
    return ({ forward }) => (ops$) => pipe(ops$, forward);
  }

  if (isNative) {
    return curriedDevtoolsExchange(createNativeArgs());
  }

  return curriedDevtoolsExchange(createBrowserArgs());
};

export const devtoolsExchange = createExchange();
