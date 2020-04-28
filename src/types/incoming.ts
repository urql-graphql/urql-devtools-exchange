/** Trigger a GraphQL request via the client. */
export interface ExecuteRequestMessage {
  type: 'request';
  query: string;
}

/** Request version info about currently running exchange. */
export interface ExchangeVersionRequestMessage {
  type: 'exchange-version-request';
}

export type DevtoolsExchangeIncomingMessage =
  | ExecuteRequestMessage
  | ExchangeVersionRequestMessage;

export const DevtoolsExchangeIncomingEventType = 'urql-devtools-exchange-in' as const;
