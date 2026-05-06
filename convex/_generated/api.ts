/* eslint-disable */
/**
 * Schema-aware stub for `convex/_generated/api`.
 *
 * `npx convex dev` / `npx convex deploy` regenerates this file with real
 * runtime references. The stub provides:
 *   1. Type-safe FunctionReference exports derived from each Convex module's
 *      validators, so consumers get arg/return type checking before deploy.
 *   2. The `anyApi` runtime resolver so function references actually work
 *      under tests (convex-test) and on a fresh checkout where convex codegen
 *      hasn't run yet. `anyApi` returns a path-resolving Proxy, so
 *      `api.workshops.create` evaluates to a valid FunctionReference.
 */
import { anyApi } from "convex/server";
import type * as hello from "../hello";
import type * as workshops from "../workshops";
import type * as participants from "../participants";
import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  hello: typeof hello;
  workshops: typeof workshops;
  participants: typeof participants;
}>;

export const api = anyApi as unknown as FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export const internal = anyApi as unknown as FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
