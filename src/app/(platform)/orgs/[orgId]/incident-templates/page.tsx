"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/layout/empty-state";
import { Plus, AlertTriangle, MoreHorizontal, Eye, Power, PowerOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Demo data for incident templates since we don't have a hook for this yet
const DEMO_INCIDENT_TEMPLATES = [
  {
    _id: "template-1",
    name: "Standard Injury Investigation",
    description: "Template for investigating workplace injuries",
    incidentType: "injury" as const,
    isActive: true,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "template-2",
    name: "Near Miss Report",
    description: "Quick reporting template for near miss incidents",
    incidentType: "near_miss" as const,
    isActive: true,
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "template-3",
    name: "Property Damage Assessment",
    description: "Template for documenting property damage incidents",
    incidentType: "property_damage" as const,
    isActive: true,
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "template-4",
    name: "Environmental Incident",
    description: "Template for environmental impact incidents",
    incidentType: "environmental" as const,
    isActive: false,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
];

type IncidentType = "injury" | "near_miss" | "property_damage" | "environmental" | "other";

interface IncidentTemplate {
  _id: string;
  name: string;
  description: string;
  incidentType: IncidentType;
  isActive: boolean;
  createdAt: number;
}

export default function IncidentTemplatesPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const [templates] = useState<IncidentTemplate[]>(DEMO_INCIDENT_TEMPLATES);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredTemplates = filter === "all"
    ? templates
    : templates.filter(t => filter === "active" ? t.isActive : !t.isActive);

  const getTypeConfig = (type: IncidentType): { status: string; label: string } => {
    switch (type) {
      case "injury":
        return { status: "rejected", label: "Injury" };
      case "near_miss":
        return { status: "pending", label: "Near Miss" };
      case "property_damage":
        return { status: "draft", label: "Property Damage" };
      case "environmental":
        return { status: "in_progress", label: "Environmental" };
      case "other":
        return { status: "closed", label: "Other" };
      default:
        return { status: "draft", label: type };
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incident Templates"
        subtitle="Configure incident investigation templates for your organization"
        actions={
          <Link href={`/orgs/${orgId}/incident-templates/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "active", "inactive"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {filteredTemplates.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No incident templates"
          description={
            filter === "all"
              ? "Create your first incident template to get started"
              : `No ${filter} templates found`
          }
          action={
            filter === "all" ? (
              <Link href={`/orgs/${orgId}/incident-templates/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Incident Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => {
                  const typeConfig = getTypeConfig(template.incidentType);
                  return (
                    <TableRow key={template._id}>
                      <TableCell>
                        <div>
                          <Link
                            href={`/orgs/${orgId}/incident-templates/${template._id}`}
                            className="font-medium hover:underline"
                          >
                            {template.name}
                          </Link>
                          {template.description && (
                            <p className="text-sm text-[var(--color-text-muted)] truncate max-w-[300px]">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={typeConfig.status} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={template.isActive ? "active" : "closed"} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/orgs/${orgId}/incident-templates/${template._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              {template.isActive ? (
                                <>
                                  <PowerOff className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
