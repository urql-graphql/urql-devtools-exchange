import { pipe, tap, take, publish, toPromise } from 'wonka';
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
import { getDisplayName } from './utils';
import { hash } from './utils/hash';
import { parse } from 'graphql';

export const devtoolsExchange: Exchange = ({ client, forward }) => {
  // Disable in prod and SSR
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') {
    return (ops$) => pipe(ops$, forward);
  }

  // Expose graphql url for introspection
  window.__urql__ = {
    url: client.url,
  };

  // Listen for messages from content script
  window.addEventListener(DevtoolsExchangeIncomingEventType, (event) => {
    const e = event as CustomEvent<DevtoolsExchangeIncomingMessage>;
    const handler = messageHandlers[e.detail.type];
    handler && handler(client)(e.detail);
  });

  // Tell the content script we are present
  sendToContentScript({ type: 'init' });

  // Forward debug events to content script
  client.debugTarget!.addEventListener((event) =>
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
    return sendDebugToContentScript({
      type: 'teardown',
      message: 'The operation has been torn down',
      operation,
    });
  }

  return sendDebugToContentScript({
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
    return sendDebugToContentScript({
      type: 'error',
      message: 'The operation has returned a new error.',
      operation,
      data: {
        value: error,
      },
    });
  }

  return sendDebugToContentScript({
    type: 'update',
    message: 'The operation has returned a new response.',
    operation,
    data: {
      value: data,
    },
  });
};

const sendToContentScript = (detail: DevtoolsExchangeOutgoingMessage) =>
  window.dispatchEvent(
    new CustomEvent(DevtoolsExchangeOutgoingEventType, { detail })
  );

const sendDebugToContentScript = <T extends string>(debug: DebugEventArg<T>) =>
  sendToContentScript({
    type: 'debug',
    data: JSON.parse(
      JSON.stringify({
        ...debug,
        source: 'devtoolsExchange',
      })
    ),
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
