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
import { getDisplayName, hash } from './utils';
import { parse } from 'graphql';
/* eslint-disable-next-line */
// @ts-ignore
import { version } from '../package.json';

export const devtoolsExchange: Exchange = ({ client, forward }) => {
  if (
    typeof window === 'undefined' ||
    process?.env?.NODE_ENV === 'production'
  ) {
    return (ops$) => pipe(ops$, forward);
  }

  /* eslint-disable-next-line @typescript-eslint/camelcase */
  window.__urql_devtools__ = {
    version,
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

const sendToContentScript = (detail: DevtoolsExchangeOutgoingMessage) =>
  window.dispatchEvent(
    new CustomEvent(DevtoolsExchangeOutgoingEventType, {
      detail: JSON.parse(JSON.stringify(detail)),
    })
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
