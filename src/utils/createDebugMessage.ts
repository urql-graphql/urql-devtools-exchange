import { DebugEventArg } from '@urql/core';

export const createDebugMessage = <T extends string>(debug: DebugEventArg<T>) =>
  ({
    type: 'debug',
    data: {
      ...debug,
      source: 'devtoolsExchange',
      timestamp: Date.now(),
    },
  } as const);
