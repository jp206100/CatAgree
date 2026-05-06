/* eslint-disable */
/**
 * Schema-aware stub for `convex/_generated/dataModel`.
 *
 * `npx convex dev` / `npx convex deploy` regenerates this file. We bind
 * `Doc` and `Id` to the schema here so consumer code can type-check before
 * deploy.
 */
import type {
  DocumentByName,
  TableNamesInDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";
import type { DataModel } from "./server";

export type TableNames = TableNamesInDataModel<DataModel>;
export type Doc<T extends TableNames> = DocumentByName<DataModel, T>;
export type Id<T extends TableNames> = GenericId<T>;
