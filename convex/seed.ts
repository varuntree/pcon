import { mutation } from "./_generated/server";
import { timestamps } from "./lib/time";

export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingOrgs = await ctx.db.query("orgs").first();
    if (existingOrgs) {
      return { message: "Database already seeded" };
    }

    const ts = timestamps();

    // Create demo org
    const demoOrgId = await ctx.db.insert("orgs", {
      name: "BuildRight Construction",
      abn: "12345678901",
      kind: "principal",
      contactName: "John Smith",
      contactEmail: "john@buildright.com.au",
      contactPhone: "0412 345 678",
      ...ts,
    });

    // Create client org
    const clientOrgId = await ctx.db.insert("orgs", {
      name: "Metro Developments",
      abn: "98765432109",
      kind: "client",
      contactName: "Sarah Johnson",
      contactEmail: "sarah@metrodev.com.au",
      ...ts,
    });

    // Create trades
    const trades = [
      { code: "ELEC", name: "Electrical", description: "Electrical work and installations" },
      { code: "PLUM", name: "Plumbing", description: "Plumbing and drainage" },
      { code: "CARP", name: "Carpentry", description: "Carpentry and joinery" },
      { code: "CONC", name: "Concrete", description: "Concrete and formwork" },
      { code: "STEE", name: "Steel", description: "Structural steel work" },
    ];

    const tradeIds: Record<string, unknown> = {};
    for (const trade of trades) {
      const id = await ctx.db.insert("trades", {
        ...trade,
        isActive: true,
        ...ts,
      });
      tradeIds[trade.code] = id;
    }

    // Create projects
    const project1Id = await ctx.db.insert("projects", {
      orgId: demoOrgId,
      clientOrgId: clientOrgId,
      name: "Riverside Apartments",
      code: "RSA-001",
      address: "123 River Street, Melbourne VIC 3000",
      value: 15000000, // $150,000 in cents
      status: "active",
      startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      endDate: Date.now() + 180 * 24 * 60 * 60 * 1000, // 180 days from now
      ...ts,
    });

    const project2Id = await ctx.db.insert("projects", {
      orgId: demoOrgId,
      name: "Harbor Office Tower",
      code: "HOT-002",
      address: "45 Harbor Way, Sydney NSW 2000",
      value: 25000000,
      status: "planning",
      startDate: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days from now
      ...ts,
    });

    // Create workers
    const worker1Id = await ctx.db.insert("workers", {
      orgId: demoOrgId,
      fullName: "Mike Thompson",
      email: "mike.thompson@buildright.com.au",
      phone: "0413 111 222",
      role: "project_manager",
      status: "active",
      emergencyName: "Jane Thompson",
      emergencyPhone: "0413 333 444",
      emergencyRelation: "Spouse",
      ...ts,
    });

    const worker2Id = await ctx.db.insert("workers", {
      orgId: demoOrgId,
      fullName: "David Chen",
      email: "david.chen@buildright.com.au",
      phone: "0414 555 666",
      role: "site_supervisor",
      status: "active",
      tradeId: tradeIds["ELEC"] as never,
      ...ts,
    });

    const worker3Id = await ctx.db.insert("workers", {
      orgId: demoOrgId,
      fullName: "Emma Wilson",
      email: "emma.wilson@buildright.com.au",
      phone: "0415 777 888",
      role: "safety_officer",
      status: "active",
      ...ts,
    });

    // Assign workers to projects
    await ctx.db.insert("workerAssignments", {
      workerId: worker1Id,
      projectId: project1Id,
      role: "project_manager",
      createdAt: ts.createdAt,
    });

    await ctx.db.insert("workerAssignments", {
      workerId: worker2Id,
      projectId: project1Id,
      role: "site_supervisor",
      createdAt: ts.createdAt,
    });

    await ctx.db.insert("workerAssignments", {
      workerId: worker3Id,
      projectId: project1Id,
      role: "safety_officer",
      createdAt: ts.createdAt,
    });

    // Create work packages for project 1
    await ctx.db.insert("workPackages", {
      orgId: demoOrgId,
      projectId: project1Id,
      name: "Electrical Fit-out - Level 1",
      description: "Complete electrical installation for Level 1",
      status: "active",
      tradeId: tradeIds["ELEC"] as never,
      phaseId: "phase-1",
      ...ts,
    });

    await ctx.db.insert("workPackages", {
      orgId: demoOrgId,
      projectId: project1Id,
      name: "Plumbing Rough-in",
      description: "Rough-in plumbing for all levels",
      status: "planned",
      tradeId: tradeIds["PLUM"] as never,
      phaseId: "phase-1",
      ...ts,
    });

    return {
      message: "Seed data created successfully",
      demoOrgId,
      project1Id,
      project2Id,
    };
  },
});
