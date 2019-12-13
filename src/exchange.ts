import { map, pipe, tap, toPromise, take, filter, merge, share } from "wonka";
import {
  Exchange,
  Client,
  Operation,
  OperationResult,
  OperationDebugMeta
} from "urql";
import {
  DevtoolsExchangeOutgoingMessage,
  DevtoolsExchangeOutgoingEventType,
  ExecuteRequestMessage,
  DevtoolsExchangeIncomingEventType,
  DevtoolsExchangeIncomingMessage
} from "./types";
import { getDisplayName } from "./utils";
import { hash } from "./utils/hash";
import { parse } from "graphql";

export const devtoolsExchange: Exchange = ({ client, forward }) => {
  if (typeof window === "undefined") {
    return ops$ => pipe(ops$, forward);
  }

  // Expose graphql url for introspection
  window.__urql__ = {
    url: client.url
  };

  // Listen for messages from content script
  window.addEventListener(DevtoolsExchangeIncomingEventType, event => {
    const e = event as CustomEvent<DevtoolsExchangeIncomingMessage>;
    const handler = messageHandlers[e.detail.type];
    handler && handler(client)(e.detail);
  });
  sendToContentScript({ type: "init" });

  return ops$ => {
    const sharedOps$ = pipe(ops$, map(addOperationContext), share);

    const isDevtoolsOp = (o: Operation) =>
      Boolean(o.context.meta && o.context.meta.source === "Devtools");

    const appOps$ = pipe(
      sharedOps$,
      filter(o => !isDevtoolsOp(o)),
      tap(handleOperation),
      forward,
      map(addOperationResponseContext),
      tap(handleOperation)
    );

    const devtoolsOps$ = pipe(
      sharedOps$,
      filter(o => isDevtoolsOp(o)),
      forward
    );

    return merge([appOps$, devtoolsOps$]);
  };
};

const addOperationResponseContext = (op: OperationResult): OperationResult => ({
  ...op,
  operation: {
    ...op.operation,
    context: {
      ...op.operation.context,
      meta: {
        ...op.operation.context.meta,
        networkLatency:
          Date.now() -
          ((op.operation.context.meta as OperationDebugMeta)
            .startTime as number)
      }
    }
  }
});

const addOperationContext = (op: Operation): Operation => ({
  ...op,
  context: {
    ...op.context,
    meta: {
      ...op.context.meta,
      source: (op.context.meta && op.context.meta.source) || getDisplayName(),
      startTime: Date.now()
    }
  }
});

/** Handle operation or response from stream. */
const handleOperation = <T extends Operation | OperationResult>(op: T) => {
  const event = JSON.parse(JSON.stringify(parseStreamData(op))); // Serialization required for some events (such as error)
  sendToContentScript(event);
};

/** Handles execute request messages. */
const requestHandler = (client: Client) => (message: ExecuteRequestMessage) => {
  const isMutation = /(^|\W)+mutation\W/.test(message.query);
  const requestType = isMutation ? "mutation" : "query";
  const op = client.createRequestOperation(
    requestType,
    {
      key: hash(JSON.stringify(message.query)),
      query: parse(message.query)
    },
    {
      meta: {
        source: "Devtools"
      }
    }
  );

  handleOperation(op);
  pipe(
    client.executeRequestOperation(op),
    tap(handleOperation),
    take(1),
    toPromise
  );
};

/** Map of handlers for incoming messages. */
const messageHandlers = {
  request: requestHandler
} as const;

/** Creates a DevtoolsExchangeOutgoingMessage from operations/responses. */
const parseStreamData = <T extends Operation | OperationResult>(op: T) => {
  const timestamp = Date.now();

  // Outgoing operation
  if ("operationName" in op) {
    return {
      type: "operation",
      data: op,
      timestamp
    } as const;
  }

  // Incoming error
  if ((op as OperationResult).error !== undefined) {
    return { type: "error", data: op, timestamp } as const;
  }

  // Incoming response
  return {
    type: "response",
    data: op,
    timestamp
  } as const;
};

const sendToContentScript = (detail: DevtoolsExchangeOutgoingMessage) =>
  window.dispatchEvent(
    new CustomEvent(DevtoolsExchangeOutgoingEventType, { detail })
  );
