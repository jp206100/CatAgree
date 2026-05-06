/* eslint-disable */
/**
 * Schema-aware stub for `convex/_generated/server`.
 *
 * `npx convex dev` / `npx convex deploy` regenerates this file with the real
 * runtime + types. We bind the generic builders to our schema here so:
 *   1. Local TypeScript checks (e.g. `tsc --noEmit`) catch ctx/args
 *      mismatches before deploy.
 *   2. Vitest can import the runtime exports under `convex-test` without
 *      hitting "Cannot find module" — the .d.ts-only stub couldn't.
 */
import {
  actionGeneric,
  httpActionGeneric,
  internalActionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
  mutationGeneric,
  queryGeneric,
  type ActionBuilder,
  type DataModelFromSchemaDefinition,
  type GenericActionCtx,
  type GenericMutationCtx,
  type GenericQueryCtx,
  type HttpActionBuilder,
  type MutationBuilder,
  type QueryBuilder,
} from "convex/server";
import schema from "../schema";

export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;

export const query = queryGeneric as QueryBuilder<DataModel, "public">;
export const mutation = mutationGeneric as MutationBuilder<DataModel, "public">;
export const action = actionGeneric as ActionBuilder<DataModel, "public">;
export const internalQuery = internalQueryGeneric as QueryBuilder<
  DataModel,
  "internal"
>;
export const internalMutation = internalMutationGeneric as MutationBuilder<
  DataModel,
  "internal"
>;
export const internalAction = internalActionGeneric as ActionBuilder<
  DataModel,
  "internal"
>;
export const httpAction = httpActionGeneric as HttpActionBuilder;

export { httpRouter } from "convex/server";
