import { LayoutDashboard, FolderKanban, Users, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

// Demo stats - will be replaced with real data from Convex
const stats = [
  { label: "Active Projects", value: "2", icon: FolderKanban, change: "+1 this month" },
  { label: "Total Workers", value: "15", icon: Users, change: "+3 this month" },
  { label: "Open Issues", value: "0", icon: AlertCircle, change: "No issues" },
];

export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Organization overview for ${orgId === "demo" ? "BuildRight Construction" : orgId}`}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[var(--color-text-muted)]">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-[var(--color-text-muted)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-[var(--color-text-muted)]">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chief AI Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Chief AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <LayoutDashboard className="h-8 w-8 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-lg font-medium">Chief AI Coming Soon</h3>
            <p className="mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
              Your AI-powered construction assistant will help you manage projects,
              track safety compliance, and generate reports.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
