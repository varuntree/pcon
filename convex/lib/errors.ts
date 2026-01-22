import { ConvexError } from "convex/values";

export function throwNotFound(entity: string, id?: string): never {
  throw new ConvexError({
    code: "NOT_FOUND",
    message: id ? `${entity} with id ${id} not found` : `${entity} not found`,
  });
}

export function throwValidation(message: string): never {
  throw new ConvexError({
    code: "VALIDATION_ERROR",
    message,
  });
}

export function throwUnauthorized(message: string = "Unauthorized"): never {
  throw new ConvexError({
    code: "UNAUTHORIZED",
    message,
  });
}

export function throwConflict(message: string): never {
  throw new ConvexError({
    code: "CONFLICT",
    message,
  });
}
