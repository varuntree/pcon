import { Users, Package, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/layout/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SafetyModulesCard } from "@/components/safety";

// Demo data - will be replaced with real data from Convex
const demoProject = {
  id: "proj1",
  name: "Riverside Apartments",
  code: "RSA-001",
  status: "active",
  address: "123 River Street, Melbourne VIC 3000",
  value: 15000000, // cents
  startDate: "2025-12-22",
  endDate: "2026-06-22",
};

const stats = [
  { label: "Workers Assigned", value: "12", icon: Users },
  { label: "Work Packages", value: "8", icon: Package },
  { label: "Open Issues", value: "0", icon: AlertCircle },
  { label: "Days Remaining", value: "151", icon: Clock },
];


export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = await params;
  const project = demoProject;

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        subtitle={
          <span className="flex items-center gap-2">
            {project.code} &bull; {project.address}
            <StatusBadge status={project.status} />
          </span>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Safety Modules with Live Stats */}
      <SafetyModulesCard orgId={orgId} projectId={projectId} />

      {/* Project Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="packages">Work Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-[var(--color-text-muted)]">
                    Project Code
                  </dt>
                  <dd className="text-sm">{project.code}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--color-text-muted)]">
                    Status
                  </dt>
                  <dd>
                    <StatusBadge status={project.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--color-text-muted)]">
                    Address
                  </dt>
                  <dd className="text-sm">{project.address}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--color-text-muted)]">
                    Contract Value
                  </dt>
                  <dd className="text-sm">
                    ${(project.value / 100).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--color-text-muted)]">
                    Start Date
                  </dt>
                  <dd className="text-sm">{project.startDate}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--color-text-muted)]">
                    End Date
                  </dt>
                  <dd className="text-sm">{project.endDate}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers">
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={Users}
                title="Worker list coming soon"
                description="View and manage workers assigned to this project"
                variant="compact"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages">
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={Package}
                title="Work packages coming soon"
                description="Create and manage work packages for this project"
                variant="compact"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
