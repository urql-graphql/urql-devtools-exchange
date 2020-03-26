import { DebugEvent } from '@urql/core';

export interface InitMessage {
  type: 'init';
}

export interface DisconnectMessage {
  type: 'disconnect';
}

export interface DebugMessage<T extends string = string> {
  type: 'debug';
  data: DebugEvent<T>;
}

/** Messages being sent by the devtools exchange to the content script. */
export type DevtoolsExchangeOutgoingMessage =
  | DebugMessage
  | DisconnectMessage
  | InitMessage;

/** Event type associated with events triggered by the exchange. */
export const DevtoolsExchangeOutgoingEventType = 'urql-devtools-exchange' as const;
