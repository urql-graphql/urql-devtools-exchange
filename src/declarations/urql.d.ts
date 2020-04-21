import '@urql/core';

declare module '@urql/core' {
  interface DebugEventTypes {
    teardown: never;
    /** An execute[query|mutation|subscription] call. */
    execution: {
      sourceComponent: string;
    };
    /** An operation result with data. */
    update: { value: any };
    /** An operation result with error. */
    error: { value: any };
  }
}
