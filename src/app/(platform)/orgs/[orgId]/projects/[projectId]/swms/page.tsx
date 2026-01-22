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
import { Plus, FileText, MoreHorizontal, Eye, Users, Share2, Archive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSWMSDocuments, SWMSDocumentStatus, SWMSDocumentData } from "@/hooks/use-swms-documents";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../../../../../convex/_generated/dataModel";

export default function ProjectSwmsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;
  const { data: documents, actions, isLoading } = useSWMSDocuments(projectId);
  const [filter, setFilter] = useState<SWMSDocumentStatus | "all">("all");

  const filteredDocuments = filter === "all"
    ? documents
    : documents.filter((d: SWMSDocumentData) => d.status === filter);

  const getStatusConfig = (status: SWMSDocumentStatus): string => {
    switch (status) {
      case "draft":
        return "draft";
      case "pending_review":
        return "pending_review";
      case "approved":
        return "approved";
      case "expired":
        return "expired";
      case "archived":
        return "closed";
      default:
        return "pending";
    }
  };

  const handleArchive = async (docId: string) => {
    try {
      await actions.archive(docId as Id<"swmsDocuments">);
    } catch (error) {
      console.error("Failed to archive document:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="SWMS Documents" subtitle="Loading..." />
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SWMS Documents"
        subtitle="Safe Work Method Statements for this project"
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/swms/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New SWMS
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "draft", "pending_review", "approved", "expired", "archived"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === "all" ? "All" :
             status === "pending_review" ? "Pending Review" :
             status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {filteredDocuments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No SWMS documents"
          description={
            filter === "all"
              ? "Create your first SWMS document for this project"
              : `No ${filter === "pending_review" ? "pending review" : filter} documents found`
          }
          action={
            filter === "all" ? (
              <Link href={`/orgs/${orgId}/projects/${projectId}/swms/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create SWMS
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SWMS Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Revision</TableHead>
                  <TableHead className="hidden md:table-cell">Approved</TableHead>
                  <TableHead className="hidden md:table-cell">Expires</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc: SWMSDocumentData) => (
                  <TableRow key={doc._id}>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {doc.swmsNumber}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/orgs/${orgId}/projects/${projectId}/swms/${doc._id}`}
                        className="font-medium hover:underline"
                      >
                        {doc.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={getStatusConfig(doc.status)} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      Rev {doc.revision}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {doc.approvedAt ? formatDate(doc.approvedAt) : "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {doc.expiresAt ? (
                        <span className={doc.expiresAt < Date.now() ? "text-red-600" : ""}>
                          {formatDate(doc.expiresAt)}
                        </span>
                      ) : "—"}
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
                            <Link href={`/orgs/${orgId}/projects/${projectId}/swms/${doc._id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          {doc.status === "approved" && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/orgs/${orgId}/projects/${projectId}/swms/${doc._id}/assign`}>
                                  <Users className="mr-2 h-4 w-4" />
                                  Assign Workers
                                </Link>
                              </DropdownMenuItem>
                              {doc.shareCode && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      `${window.location.origin}/w/swms/${doc.shareCode}`
                                    );
                                  }}
                                >
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Copy Share Link
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          {doc.status !== "archived" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleArchive(doc._id as string)}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
