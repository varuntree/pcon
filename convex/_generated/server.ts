/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Generated Convex types stub for development
 * This file will be overwritten when running `npx convex dev`
 */

import {
  QueryBuilder,
  MutationBuilder,
  ActionBuilder,
} from "convex/server";
import { DataModel } from "./dataModel";

export const query = ((fn: any) => fn) as QueryBuilder<DataModel, "public">;
export const mutation = ((fn: any) => fn) as MutationBuilder<DataModel, "public">;
export const action = ((fn: any) => fn) as ActionBuilder<DataModel, "public">;
export const internalQuery = ((fn: any) => fn) as QueryBuilder<DataModel, "internal">;
export const internalMutation = ((fn: any) => fn) as MutationBuilder<DataModel, "internal">;
export const internalAction = ((fn: any) => fn) as ActionBuilder<DataModel, "internal">;
