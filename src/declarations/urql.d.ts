import { OperationDebugMeta } from "@urql/core";

declare module "urql" {
  export interface OperationDebugMeta {
    startTime?: number;
  }
}
