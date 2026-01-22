import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORKER_ROLE_LABELS, type WorkerRole } from "@/lib/constants";

// Demo data - will be replaced with real data from Convex
const demoWorkers = [
  {
    id: "w1",
    fullName: "Mike Thompson",
    email: "mike.thompson@buildright.com.au",
    role: "project_manager" as WorkerRole,
    status: "active",
    phone: "0413 111 222",
  },
  {
    id: "w2",
    fullName: "David Chen",
    email: "david.chen@buildright.com.au",
    role: "site_supervisor" as WorkerRole,
    status: "active",
    phone: "0414 555 666",
  },
  {
    id: "w3",
    fullName: "Emma Wilson",
    email: "emma.wilson@buildright.com.au",
    role: "safety_officer" as WorkerRole,
    status: "active",
    phone: "0415 777 888",
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function WorkersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  await params;
  const workers = demoWorkers;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workers"
        subtitle="Manage your organization's workers"
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Add Worker
          </Button>
        }
      />

      {workers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No workers yet"
          description="Add workers to your organization to assign them to projects"
          action={
            <Button>
              <Plus className="h-4 w-4" />
              Add Worker
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow key={worker.id} className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(worker.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{worker.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {WORKER_ROLE_LABELS[worker.role] ?? worker.role}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={worker.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {worker.phone}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {worker.email}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
