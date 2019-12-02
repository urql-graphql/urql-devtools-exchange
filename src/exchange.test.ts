import { devtoolsExchange } from "./exchange";
import { makeSubject, pipe, publish, map } from "wonka";

const client = {
  url: "url_stub",
  createRequestOperation: jest.fn((operationName, data, meta) => ({
    operationName,
    ...data,
    context: {
      meta
    }
  })),
  executeRequestOperation: jest.fn(operation => ({
    operation,
    data: { stubData: "here" }
  }))
} as any;
const forward = jest.fn().mockImplementation(o =>
  map(operation => ({
    operation,
    data: { stubData: "here" }
  }))(o)
) as any;
const addEventListener = jest.spyOn(window, "addEventListener");
const dispatchEvent = jest
  .spyOn(window, "dispatchEvent")
  .mockImplementation(() => false);
jest.spyOn(Date, "now").mockReturnValue(1234);

beforeEach(jest.clearAllMocks);

describe("on mount", () => {
  const [ops$] = makeSubject<any>();

  beforeEach(() => {
    pipe(ops$, devtoolsExchange({ client, forward }), publish);
  });

  describe("window", () => {
    it("has __urql__ property", () => {
      expect(window).toHaveProperty("__urql__", { url: client.url });
    });
  });

  describe("event listener", () => {
    it("is added to window", () => {
      expect(addEventListener).toBeCalledTimes(1);
    });
  });

  describe("init event", () => {
    it("is dispatched", () => {
      expect(window.dispatchEvent).toBeCalledTimes(1);
      expect(window.dispatchEvent).toBeCalledWith({
        type: "urql-devtools-exchange",
        detail: {
          type: "init"
        }
      });
    });
  });
});

describe("on event", () => {
  const [sub, next] = makeSubject<any>();

  beforeEach(() => {
    pipe(sub, devtoolsExchange({ client, forward }), publish);
  });

  describe("on operation", () => {
    const op = {
      key: 1234,
      query: "query",
      variables: { someVar: "1234" },
      context: {
        meta: {}
      },
      operationName: "query"
    };
    beforeEach(() => {
      next(op);
    });

    it("dispatches operation event", () => {
      expect((dispatchEvent.mock.calls[1][0] as any).detail.type).toBe(
        "operation"
      );
      expect(dispatchEvent.mock.calls[1][0]).toMatchSnapshot();
    });
  });

  describe("on response", () => {
    const op = {
      key: 1234,
      query: "query",
      variables: { someVar: "1234" },
      context: {
        meta: {}
      },
      operationName: "query"
    };
    beforeEach(() => {
      next(op);
    });

    it("dispatches response event", () => {
      expect((dispatchEvent.mock.calls[2][0] as any).detail.type).toBe(
        "response"
      );
      expect(dispatchEvent.mock.calls[2][0]).toMatchSnapshot();
    });
  });
});

// Execute request from devtools
describe("on request message", () => {
  let handler: any;
  const [sub] = makeSubject<any>();
  const requestMessage = {
    detail: {
      type: "request",
      query: `query {
        todos {
          id
        }
      }`
    }
  };

  beforeEach(() => {
    pipe(sub, devtoolsExchange({ client, forward }), publish);
    handler = addEventListener.mock.calls[0][1];
  });

  describe("incoming operation", () => {
    it("is dispatched", () => {
      handler(requestMessage);
      expect(dispatchEvent.mock.calls[1][0]).toMatchSnapshot();
    });

    it("is executed", () => {
      handler(requestMessage);
      expect(client.executeRequestOperation).toBeCalledTimes(1);
    });
  });
});
