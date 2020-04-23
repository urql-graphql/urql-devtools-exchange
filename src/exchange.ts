import { pipe, tap, take, toPromise } from 'wonka';
import {
  Exchange,
  Client,
  Operation,
  OperationResult,
  DebugEventArg,
} from '@urql/core';
import {
  DevtoolsExchangeOutgoingMessage,
  DevtoolsExchangeOutgoingEventType,
  ExecuteRequestMessage,
  DevtoolsExchangeIncomingEventType,
  DevtoolsExchangeIncomingMessage,
} from './types';
import { getDisplayName, hash } from './utils';
import { parse } from 'graphql';

declare const __pkg_version__: string;

export const devtoolsExchange: Exchange = ({ client, forward }) => {
  if (
    typeof window === 'undefined' ||
    process?.env?.NODE_ENV === 'production'
  ) {
    return (ops$) => pipe(ops$, forward);
  }

  window.__urql_devtools__ = {
    version: __pkg_version__,
  };

  // Listen for messages from content script
  window.addEventListener('message', ({ data, isTrusted }) => {
    if (!isTrusted || data?.type !== DevtoolsExchangeIncomingEventType) {
      return;
    }

    const message = data.message as DevtoolsExchangeIncomingMessage;

    // const e = event as CustomEvent<DevtoolsExchangeIncomingMessage>;
    const handler = messageHandlers[message.type];
    handler && handler(client)(message);
  });

  // Tell the content script we are present
  sendToContentScript({ type: 'init' });

  // Forward debug events to content script
  client.subscribeToDebugTarget &&
    client.subscribeToDebugTarget((event) =>
      sendToContentScript({
        type: 'debug',
        data: event,
      })
    );

  return (ops$) => pipe(ops$, tap(handleOperation), forward, tap(handleResult));
};

/** Handle outgoing operations */
const handleOperation = (operation: Operation) => {
  if (operation.operationName === 'teardown') {
    return sendDevtoolsDebug({
      type: 'teardown',
      message: 'The operation has been torn down',
      operation,
    });
  }

  return sendDevtoolsDebug({
    type: 'execution',
    message: 'The client has recieved an execute command.',
    operation,
    data: {
      sourceComponent: getDisplayName(),
    },
  });
};

/** Handle new value or error */
const handleResult = ({ operation, data, error }: OperationResult) => {
  if (error) {
    return sendDevtoolsDebug({
      type: 'error',
      message: 'The operation has returned a new error.',
      operation,
      data: {
        value: error,
      },
    });
  }

  return sendDevtoolsDebug({
    type: 'update',
    message: 'The operation has returned a new response.',
    operation,
    data: {
      value: data,
    },
  });
};

const sendToContentScript = (message: DevtoolsExchangeOutgoingMessage) =>
  window.postMessage(
    {
      type: DevtoolsExchangeOutgoingEventType,
      message: JSON.parse(JSON.stringify(message)),
    },
    window.location.origin
  );

const sendDevtoolsDebug = <T extends string>(debug: DebugEventArg<T>) =>
  sendToContentScript({
    type: 'debug',
    data: {
      ...debug,
      source: 'devtoolsExchange',
      timestamp: Date.now(),
    },
  });

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
