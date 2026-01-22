import Link from "next/link";
import { Plus, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

// Demo data - will be replaced with real data from Convex
const demoProjects = [
  {
    id: "proj1",
    name: "Riverside Apartments",
    code: "RSA-001",
    status: "active",
    address: "123 River Street, Melbourne VIC 3000",
    workerCount: 12,
    workPackageCount: 8,
  },
  {
    id: "proj2",
    name: "Harbor Office Tower",
    code: "HOT-002",
    status: "planning",
    address: "45 Harbor Way, Sydney NSW 2000",
    workerCount: 0,
    workPackageCount: 0,
  },
];

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const projects = demoProjects;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Manage your construction projects"
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Get started by creating your first project"
          action={
            <Button>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/orgs/${orgId}/projects/${project.id}`}
            >
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {project.code}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--color-text-muted)] mb-3">
                    {project.address}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text)]">
                        {project.workerCount}
                      </span>{" "}
                      workers
                    </span>
                    <span className="text-[var(--color-text-muted)]">
                      <span className="font-medium text-[var(--color-text)]">
                        {project.workPackageCount}
                      </span>{" "}
                      packages
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
