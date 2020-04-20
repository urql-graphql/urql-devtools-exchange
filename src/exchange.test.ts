import { devtoolsExchange } from './exchange';
import { makeSubject, pipe, publish, map } from 'wonka';

const Target = () => {
  let eventListeners: any[] = [];

  const addEventListener = (fn) => (eventListeners = [...eventListeners, fn]);
  const dispatchEvent = (e) => eventListeners.forEach((f) => f(e));

  return {
    addEventListener,
    dispatchEvent,
  };
};

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
    debugTarget: Target(),
  };

  forward = jest.fn().mockImplementation((o) =>
    map((operation) => ({
      operation,
      data: { stubData: 'here' },
    }))(o)
  ) as any;
});
const addEventListener = jest.spyOn(window, 'addEventListener');
const dispatchDebug = jest.fn();
const dispatchEvent = jest
  .spyOn(window, 'dispatchEvent')
  .mockImplementation(() => false);
jest.spyOn(Date, 'now').mockReturnValue(1234);

beforeEach(jest.clearAllMocks);

describe('on mount', () => {
  const { source } = makeSubject<any>();

  beforeEach(() => {
    pipe(source, devtoolsExchange({ client, forward, dispatchDebug }), publish);
  });

  describe('window', () => {
    it('has __urql__ property', () => {
      expect(window).toHaveProperty('__urql__', { url: client.url });
    });
  });

  describe('event listener', () => {
    it('is added to window', () => {
      expect(addEventListener).toBeCalledTimes(1);
    });
  });

  describe('init event', () => {
    it('is dispatched', () => {
      expect(window.dispatchEvent).toBeCalledTimes(1);
      expect(window.dispatchEvent).toBeCalledWith({
        type: 'urql-devtools-exchange',
        detail: {
          type: 'init',
        },
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
    client.debugTarget.dispatchEvent(event);

    expect(window.dispatchEvent).toBeCalledTimes(2);
    expect(window.dispatchEvent).toBeCalledWith({
      type: 'urql-devtools-exchange',
      detail: {
        type: 'debug',
        data: event,
      },
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
      expect((window.dispatchEvent as any).mock.calls[1])
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "detail": Object {
              "data": Object {
                "data": Object {
                  "sourceComponent": "Unknown",
                },
                "message": "The client has recieved an execute command.",
                "operation": Object {
                  "operationName": "query",
                },
                "source": "devtoolsExchange",
                "timestamp": 1234,
                "type": "execution",
              },
              "type": "debug",
            },
            "type": "urql-devtools-exchange",
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
      expect((window.dispatchEvent as any).mock.calls[1])
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "detail": Object {
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
            "type": "urql-devtools-exchange",
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
      expect((window.dispatchEvent as any).mock.calls[2])
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "detail": Object {
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
            "type": "urql-devtools-exchange",
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
      expect((window.dispatchEvent as any).mock.calls[2])
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "detail": Object {
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
            "type": "urql-devtools-exchange",
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
    detail: {
      type: 'request',
      query: `query {
        todos {
          id
        }
      }`,
    },
  };

  beforeEach(() => {
    pipe(source, devtoolsExchange({ client, forward, dispatchDebug }), publish);
    handler = addEventListener.mock.calls[0][1];
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
          "key": 487904461,
          "operationName": "query",
          "query": Object {
            "definitions": Array [
              Object {
                "directives": Array [],
                "kind": "OperationDefinition",
                "loc": Object {
                  "end": 54,
                  "start": 0,
                },
                "name": undefined,
                "operation": "query",
                "selectionSet": Object {
                  "kind": "SelectionSet",
                  "loc": Object {
                    "end": 54,
                    "start": 6,
                  },
                  "selections": Array [
                    Object {
                      "alias": undefined,
                      "arguments": Array [],
                      "directives": Array [],
                      "kind": "Field",
                      "loc": Object {
                        "end": 46,
                        "start": 16,
                      },
                      "name": Object {
                        "kind": "Name",
                        "loc": Object {
                          "end": 21,
                          "start": 16,
                        },
                        "value": "todos",
                      },
                      "selectionSet": Object {
                        "kind": "SelectionSet",
                        "loc": Object {
                          "end": 46,
                          "start": 22,
                        },
                        "selections": Array [
                          Object {
                            "alias": undefined,
                            "arguments": Array [],
                            "directives": Array [],
                            "kind": "Field",
                            "loc": Object {
                              "end": 36,
                              "start": 34,
                            },
                            "name": Object {
                              "kind": "Name",
                              "loc": Object {
                                "end": 36,
                                "start": 34,
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
              "end": 54,
              "start": 0,
            },
          },
        },
      ]
    `);
  });
});
