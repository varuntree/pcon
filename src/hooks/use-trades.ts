"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

// Demo trade type for fallback data
type DemoTrade = Doc<"trades"> & { _id: Id<"trades">; _creationTime: number };

// Demo data fallback when Convex is not configured
const DEMO_TRADES: DemoTrade[] = [
  {
    _id: "trade1" as Id<"trades">,
    _creationTime: Date.now(),
    code: "CARP",
    name: "Carpentry",
    description: "Structural and finish carpentry work",
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "trade2" as Id<"trades">,
    _creationTime: Date.now(),
    code: "ELEC",
    name: "Electrical",
    description: "Electrical installation and maintenance",
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "trade3" as Id<"trades">,
    _creationTime: Date.now(),
    code: "PLMB",
    name: "Plumbing",
    description: "Plumbing and drainage work",
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "trade4" as Id<"trades">,
    _creationTime: Date.now(),
    code: "CONC",
    name: "Concrete",
    description: "Concrete pouring and finishing",
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "trade5" as Id<"trades">,
    _creationTime: Date.now(),
    code: "STEE",
    name: "Steel Fixing",
    description: "Reinforcement steel installation",
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export interface CreateTradeInput {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateTradeInput {
  id: Id<"trades">;
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Trade data returned from hook
export type TradeData = DemoTrade;

export function useTrades(): {
  data: TradeData[];
  actions: {
    create: (input: CreateTradeInput) => Promise<Id<"trades">>;
    update: (input: UpdateTradeInput) => Promise<Id<"trades">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  // Use "skip" to skip the query when Convex is not available
  const tradesQuery = useQuery(api.trades.list, convexAvailable ? {} : "skip");
  const createMutation = useMutation(api.trades.create);
  const updateMutation = useMutation(api.trades.update);

  // Use demo data if Convex is not available
  const data: TradeData[] = convexAvailable
    ? ((tradesQuery ?? []) as TradeData[])
    : DEMO_TRADES;
  const isLoading = convexAvailable && tradesQuery === undefined;

  const actions = {
    create: async (input: CreateTradeInput): Promise<Id<"trades">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-trade-new" as Id<"trades">;
      }
      return await createMutation(input);
    },
    update: async (input: UpdateTradeInput): Promise<Id<"trades">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
  };

  return { data, actions, isLoading };
}

export function useActiveTrades() {
  const { data: trades, isLoading } = useTrades();

  const filtered = trades.filter((t) => t.isActive);

  return { data: filtered, isLoading };
}

export function useTrade(id: Id<"trades"> | string) {
  const { data: trades, isLoading } = useTrades();

  const trade = trades.find((t) => t._id === id);

  return { data: trade ?? null, isLoading };
}

export function useTradeByCode(code: string) {
  const { data: trades, isLoading } = useTrades();

  const trade = trades.find((t) => t.code === code);

  return { data: trade ?? null, isLoading };
}
