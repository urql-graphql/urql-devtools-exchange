import { OperationDebugMeta } from "urql";

declare module "urql" {
  export interface OperationDebugMeta {
    startTime?: number;
  }
}
