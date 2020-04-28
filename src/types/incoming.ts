/** Trigger a GraphQL request via the client. */
export interface ExecuteRequestMessage {
  type: 'request';
  query: string;
}

/** Request version info about currently running exchange. */
export interface GetVersionMessage {
  type: 'get-version';
}

export type DevtoolsExchangeIncomingMessage =
  | ExecuteRequestMessage
  | GetVersionMessage;

export const DevtoolsExchangeIncomingEventType = 'urql-devtools-exchange-in' as const;
