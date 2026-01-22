import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { now, updatedAt, timestamps } from "./lib/time";

const assetType = v.union(
  v.literal("plant"),
  v.literal("equipment"),
  v.literal("vehicle"),
  v.literal("tool"),
  v.literal("other")
);

const assetStatus = v.union(
  v.literal("available"),
  v.literal("in_use"),
  v.literal("maintenance"),
  v.literal("retired")
);

// Validation helpers
function validateVehicleFields(args: {
  registrationNumber?: string;
  vin?: string;
  year?: number;
}) {
  if (args.registrationNumber !== undefined) {
    const len = args.registrationNumber.length;
    if (len < 2 || len > 8) {
      throwValidation("Registration number must be 2-8 characters");
    }
  }

  if (args.vin !== undefined && args.vin.length !== 17) {
    throwValidation("VIN must be exactly 17 characters");
  }

  if (args.year !== undefined) {
    const currentYear = new Date().getFullYear();
    if (args.year < 1900 || args.year > currentYear) {
      throwValidation(`Year must be between 1900 and ${currentYear}`);
    }
  }
}

// List assets by org
export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assets")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

// List assets by project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List assets by register
export const listByRegister = query({
  args: { registerId: v.id("assetRegisters") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assets")
      .withIndex("by_register", (q) => q.eq("registerId", args.registerId))
      .collect();
  },
});

// List assets by org + status
export const listByStatus = query({
  args: {
    orgId: v.id("orgs"),
    status: assetStatus,
  },
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
    return assets.filter((a) => a.status === args.status);
  },
});

// List available assets by org
export const listAvailable = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
    return assets.filter((a) => a.status === "available");
  },
});

// Get single asset by ID
export const get = query({
  args: { id: v.id("assets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (!asset) {
      throwNotFound("Asset", args.id);
    }
    return asset;
  },
});

// Get asset by QR code (<100ms via index)
export const getByQRCode = query({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    const asset = await ctx.db
      .query("assets")
      .withIndex("by_qrCode", (q) => q.eq("qrCode", args.qrCode))
      .first();
    if (!asset) {
      throwNotFound("Asset with qrCode", args.qrCode);
    }
    return asset;
  },
});

// Get asset by org + itemId
export const getByItemId = query({
  args: {
    orgId: v.id("orgs"),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
    const asset = assets.find((a) => a.itemId === args.itemId);
    if (!asset) {
      throwNotFound("Asset with itemId", args.itemId);
    }
    return asset;
  },
});

// Get asset with register, allocations, service history
export const getWithDetails = query({
  args: { id: v.id("assets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (!asset) {
      throwNotFound("Asset", args.id);
    }

    const [register, allocations, serviceLogs] = await Promise.all([
      ctx.db.get(asset.registerId as Id<"assetRegisters">),
      ctx.db
        .query("assetAllocations")
        .withIndex("by_asset", (q) => q.eq("assetId", args.id))
        .collect(),
      ctx.db
        .query("assetServiceLogs")
        .withIndex("by_asset", (q) => q.eq("assetId", args.id))
        .collect(),
    ]);

    return {
      ...asset,
      register,
      allocations,
      serviceLogs,
    };
  },
});

// Create asset with auto-generated itemId
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    projectId: v.optional(v.id("projects")),
    registerId: v.id("assetRegisters"),
    assetType: assetType,
    name: v.string(),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    serialNumber: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    vin: v.optional(v.string()),
    year: v.optional(v.number()),
    createdBy: v.id("workers"),
  },
  handler: async (ctx, args) => {
    // Validate vehicle fields
    validateVehicleFields({
      registrationNumber: args.registrationNumber,
      vin: args.vin,
      year: args.year,
    });

    // Verify org exists
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throwNotFound("Organization", args.orgId);
    }

    // Verify project exists and belongs to org (if provided)
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throwNotFound("Project", args.projectId);
      }
      if (project.orgId !== args.orgId) {
        throwValidation("Project does not belong to this organization");
      }
    }

    // Verify register exists and belongs to org
    const register = await ctx.db.get(args.registerId);
    if (!register) {
      throwNotFound("AssetRegister", args.registerId);
    }
    if (register.orgId !== args.orgId) {
      throwValidation("Asset register does not belong to this organization");
    }

    // Verify creator exists
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throwNotFound("Worker (createdBy)", args.createdBy);
    }

    // Generate itemId (ASSET-001 per org)
    const existing = await ctx.db
      .query("assets")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
    const nextNum = existing.length + 1;
    const itemId = `ASSET-${String(nextNum).padStart(3, "0")}`;

    const insertData: Parameters<typeof ctx.db.insert<"assets">>[1] = {
      orgId: args.orgId,
      registerId: args.registerId,
      itemId,
      assetType: args.assetType,
      name: args.name,
      status: "available",
      createdBy: args.createdBy,
      ...timestamps(),
    };

    if (args.projectId !== undefined) {
      insertData.projectId = args.projectId;
    }
    if (args.make !== undefined) {
      insertData.make = args.make;
    }
    if (args.model !== undefined) {
      insertData.model = args.model;
    }
    if (args.serialNumber !== undefined) {
      insertData.serialNumber = args.serialNumber;
    }
    if (args.registrationNumber !== undefined) {
      insertData.registrationNumber = args.registrationNumber;
    }
    if (args.vin !== undefined) {
      insertData.vin = args.vin;
    }
    if (args.year !== undefined) {
      insertData.year = args.year;
    }

    return await ctx.db.insert("assets", insertData);
  },
});

// Update asset fields
export const update = mutation({
  args: {
    id: v.id("assets"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    serialNumber: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    vin: v.optional(v.string()),
    year: v.optional(v.number()),
    odometerKm: v.optional(v.number()),
    odometerHours: v.optional(v.number()),
    purchaseDate: v.optional(v.number()),
    purchasePrice: v.optional(v.number()),
    imageId: v.optional(v.id("_storage")),
    qrCode: v.optional(v.string()),
    nextServiceDue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const asset = await ctx.db.get(id);
    if (!asset) {
      throwNotFound("Asset", id);
    }

    if (asset.status === "retired") {
      throwValidation("Cannot update a retired asset");
    }

    // Validate vehicle fields
    validateVehicleFields({
      registrationNumber: updates.registrationNumber,
      vin: updates.vin,
      year: updates.year,
    });

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      ...updatedAt(),
    });

    return id;
  },
});

// Update asset status
export const updateStatus = mutation({
  args: {
    id: v.id("assets"),
    status: assetStatus,
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (!asset) {
      throwNotFound("Asset", args.id);
    }

    if (asset.status === "retired" && args.status !== "retired") {
      throwValidation("Cannot change status of a retired asset");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Retire asset
export const retire = mutation({
  args: { id: v.id("assets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (!asset) {
      throwNotFound("Asset", args.id);
    }

    if (asset.status === "retired") {
      throwValidation("Asset is already retired");
    }

    await ctx.db.patch(args.id, {
      status: "retired",
      ...updatedAt(),
    });

    return args.id;
  },
});

// Update odometer (must increment or stay same)
export const updateOdometer = mutation({
  args: {
    id: v.id("assets"),
    odometerKm: v.optional(v.number()),
    odometerHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (!asset) {
      throwNotFound("Asset", args.id);
    }

    if (asset.status === "retired") {
      throwValidation("Cannot update odometer on a retired asset");
    }

    // Validate odometerKm (must increment or stay same)
    if (args.odometerKm !== undefined) {
      const currentKm = (asset.odometerKm as number | undefined) ?? 0;
      if (args.odometerKm < currentKm) {
        throwValidation(
          `Odometer (km) cannot decrease. Current: ${currentKm}, provided: ${args.odometerKm}`
        );
      }
    }

    // Validate odometerHours (must increment or stay same)
    if (args.odometerHours !== undefined) {
      const currentHours = (asset.odometerHours as number | undefined) ?? 0;
      if (args.odometerHours < currentHours) {
        throwValidation(
          `Odometer (hours) cannot decrease. Current: ${currentHours}, provided: ${args.odometerHours}`
        );
      }
    }

    const patchData: {
      odometerKm?: number;
      odometerHours?: number;
      updatedAt: number;
    } = {
      ...updatedAt(),
    };

    if (args.odometerKm !== undefined) {
      patchData.odometerKm = args.odometerKm;
    }
    if (args.odometerHours !== undefined) {
      patchData.odometerHours = args.odometerHours;
    }

    await ctx.db.patch(args.id, patchData);

    return args.id;
  },
});
