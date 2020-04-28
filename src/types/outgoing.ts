import { DebugEvent } from '@urql/core';

/** Initial handshaking message. */
export interface InitMessage {
  type: 'init';
}

/** Declare running exchange version (part of handshaking). */
export interface DeclareVersionMessage {
  type: 'declare-version';
  version: string;
}

/** Connection closed message. */
export interface DisconnectMessage {
  type: 'disconnect';
}

/** Debugging event. */
export interface DebugMessage<T extends string = string> {
  type: 'debug';
  data: DebugEvent<T>;
}

/** Messages being sent by the devtools exchange to the content script. */
export type DevtoolsExchangeOutgoingMessage =
  | DebugMessage
  | DisconnectMessage
  | DeclareVersionMessage
  | InitMessage;

/** Event type associated with events triggered by the exchange. */
export const DevtoolsExchangeOutgoingEventType = 'urql-devtools-exchange' as const;
