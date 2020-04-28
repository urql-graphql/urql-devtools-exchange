jest.mock('./utils/messaging', () => {
  const messenger = {
    addMessageListener: jest.fn(),
    sendMessage: jest.fn(),
  };

  return {
    messenger,
    createNativeMessenger: jest.fn(() => messenger),
    createBrowserMessenger: jest.fn(() => messenger),
  };
});
import { makeSubject, pipe, publish, map } from 'wonka';
import { devtoolsExchange } from './exchange';
import { createBrowserMessenger } from './utils';

const {
  addMessageListener,
  sendMessage,
} = (createBrowserMessenger() as any) as Record<string, jest.Mock>;

const version = '200.0.0';
(global as any).__pkg_version__ = version;

let client: any;
let forward: any;

beforeEach(() => {
  client = {
    url: 'url_stub',
    createRequestOperation: jest.fn((operationName, data, meta) => ({
      operationName,
      ...data,
      context: {
        meta,
      },
    })),
    executeRequestOperation: jest.fn((operation) => ({
      operation,
      data: { stubData: 'here' },
    })),
    subscribeToDebugTarget: jest.fn(),
  };

  forward = jest.fn().mockImplementation((o) =>
    map((operation) => ({
      operation,
      data: { stubData: 'here' },
    }))(o)
  ) as any;
});
const dispatchDebug = jest.fn();

jest.spyOn(Date, 'now').mockReturnValue(1234);

beforeEach(jest.clearAllMocks);

describe('on mount', () => {
  const { source } = makeSubject<any>();

  beforeEach(() => {
    pipe(source, devtoolsExchange({ client, forward, dispatchDebug }), publish);
  });

  describe('message listener', () => {
    it('is added', () => {
      expect(addMessageListener).toBeCalledTimes(1);
    });
  });

  describe('init event', () => {
    it('is dispatched', () => {
      expect(sendMessage).toBeCalledTimes(1);
      expect(sendMessage).toBeCalledWith({
        type: 'init',
      });
    });
  });
});

describe('on debug message', () => {
  it('sends to content script', () => {
    const event = {
      type: 'customDebug',
      message: 'This is a custom debug message',
      source: 'customExchange',
      data: {
        value: 1234,
      },
    };

    devtoolsExchange({ client, forward, dispatchDebug });
    const subscriber = client.subscribeToDebugTarget.mock.calls[0][0];
    subscriber(event);

    expect(sendMessage).toBeCalledTimes(2);
    expect(sendMessage).toBeCalledWith({
      type: 'debug',
      data: event,
    });
  });
});

describe('on operation', () => {
  describe('on execute', () => {
    it('dispatches debug "update" event', () => {
      const operation = {
        operationName: 'query',
      };

      const { source, next } = makeSubject<any>();

      pipe(
        source,
        devtoolsExchange({ client, forward, dispatchDebug }),
        publish
      );
      next(operation);
      expect(sendMessage.mock.calls[1]).toMatchInlineSnapshot(`
        Array [
          Object {
            "data": Object {
              "data": Object {
                "sourceComponent": "Unknown",
              },
              "message": "The client has received an execute command.",
              "operation": Object {
                "operationName": "query",
              },
              "source": "devtoolsExchange",
              "timestamp": 1234,
              "type": "execution",
            },
            "type": "debug",
          },
        ]
      `);
    });
  });

  describe('on teardown', () => {
    it('dispatches debug "teardown" event', () => {
      const operation = {
        operationName: 'teardown',
      };

      const { source, next } = makeSubject<any>();

      pipe(
        source,
        devtoolsExchange({ client, forward, dispatchDebug }),
        publish
      );
      next(operation);
      expect(sendMessage.mock.calls[1]).toMatchInlineSnapshot(`
        Array [
          Object {
            "data": Object {
              "message": "The operation has been torn down",
              "operation": Object {
                "operationName": "teardown",
              },
              "source": "devtoolsExchange",
              "timestamp": 1234,
              "type": "teardown",
            },
            "type": "debug",
          },
        ]
      `);
    });
  });

  it('forwards operations', () => {
    const operation = {
      operationName: 'query',
      key: 1,
    };

    const { source, next } = makeSubject<any>();

    forward = jest.fn().mockImplementation((o) =>
      pipe(
        o,
        map((op) => {
          expect(op).toBe(operation);
          return {
            operation,
            data: null,
          };
        })
      )
    ) as any;

    pipe(source, devtoolsExchange({ client, forward, dispatchDebug }), publish);
    next(operation);

    expect(forward).toHaveBeenCalledTimes(1);
  });
});

describe('on operation response', () => {
  describe('on data', () => {
    it('dispatches update event', () => {
      const operation = {
        operationName: 'mutation',
      };
      forward.mockImplementation((o) =>
        map((operation) => ({
          operation,
          data: { test: 1234 },
        }))(o)
      );

      const { source, next } = makeSubject<any>();

      pipe(
        source,
        devtoolsExchange({ client, forward, dispatchDebug }),
        publish
      );
      next(operation);

      // * call number two relates to the operation response
      expect(sendMessage.mock.calls[2]).toMatchInlineSnapshot(`
        Array [
          Object {
            "data": Object {
              "data": Object {
                "value": Object {
                  "test": 1234,
                },
              },
              "message": "The operation has returned a new response.",
              "operation": Object {
                "operationName": "mutation",
              },
              "source": "devtoolsExchange",
              "timestamp": 1234,
              "type": "update",
            },
            "type": "debug",
          },
        ]
      `);
    });
  });

  describe('on error', () => {
    it('dispatches update event', () => {
      const operation = {
        operationName: 'mutation',
      };
      forward.mockImplementation((o) =>
        map((operation) => ({
          operation,
          error: { test: 1234 },
        }))(o)
      );

      const { source, next } = makeSubject<any>();

      pipe(
        source,
        devtoolsExchange({ client, forward, dispatchDebug }),
        publish
      );
      next(operation);
      // * call number two relates to the operation response
      expect(sendMessage.mock.calls[2]).toMatchInlineSnapshot(`
        Array [
          Object {
            "data": Object {
              "data": Object {
                "value": Object {
                  "test": 1234,
                },
              },
              "message": "The operation has returned a new error.",
              "operation": Object {
                "operationName": "mutation",
              },
              "source": "devtoolsExchange",
              "timestamp": 1234,
              "type": "error",
            },
            "type": "debug",
          },
        ]
      `);
    });
  });
});

// Execute request from devtools
describe('on request message', () => {
  let handler: any;
  const { source } = makeSubject<any>();
  const requestMessage = {
    type: 'request',
    query: `query {
          todos {
            id
          }
        }`,
  };

  beforeEach(() => {
    pipe(source, devtoolsExchange({ client, forward, dispatchDebug }), publish);
    handler = addMessageListener.mock.calls[0][0];
  });

  it('executes request on client', () => {
    handler(requestMessage);
    expect(client.executeRequestOperation).toBeCalledTimes(1);
    expect(client.executeRequestOperation.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "context": Object {
            "meta": Object {
              "meta": Object {
                "source": "Devtools",
              },
            },
          },
          "key": 1063934861,
          "operationName": "query",
          "query": Object {
            "definitions": Array [
              Object {
                "directives": Array [],
                "kind": "OperationDefinition",
                "loc": Object {
                  "end": 62,
                  "start": 0,
                },
                "name": undefined,
                "operation": "query",
                "selectionSet": Object {
                  "kind": "SelectionSet",
                  "loc": Object {
                    "end": 62,
                    "start": 6,
                  },
                  "selections": Array [
                    Object {
                      "alias": undefined,
                      "arguments": Array [],
                      "directives": Array [],
                      "kind": "Field",
                      "loc": Object {
                        "end": 52,
                        "start": 18,
                      },
                      "name": Object {
                        "kind": "Name",
                        "loc": Object {
                          "end": 23,
                          "start": 18,
                        },
                        "value": "todos",
                      },
                      "selectionSet": Object {
                        "kind": "SelectionSet",
                        "loc": Object {
                          "end": 52,
                          "start": 24,
                        },
                        "selections": Array [
                          Object {
                            "alias": undefined,
                            "arguments": Array [],
                            "directives": Array [],
                            "kind": "Field",
                            "loc": Object {
                              "end": 40,
                              "start": 38,
                            },
                            "name": Object {
                              "kind": "Name",
                              "loc": Object {
                                "end": 40,
                                "start": 38,
                              },
                              "value": "id",
                            },
                            "selectionSet": undefined,
                          },
                        ],
                      },
                    },
                  ],
                },
                "variableDefinitions": Array [],
              },
            ],
            "kind": "Document",
            "loc": Object {
              "end": 62,
              "start": 0,
            },
          },
        },
      ]
    `);
  });
});

describe('on get-version message', () => {
  let handler: any;
  const { source } = makeSubject<any>();
  const getVersionMessage = {
    type: 'get-version',
  };

  beforeEach(() => {
    pipe(source, devtoolsExchange({ client, forward, dispatchDebug }), publish);
    handler = addMessageListener.mock.calls[0][0];
  });

  it('executes request on client', () => {
    handler(getVersionMessage);
    expect(sendMessage).toBeCalledTimes(2);
    expect(sendMessage).toBeCalledWith({
      type: 'declare-version',
      version,
    });
  });
});
