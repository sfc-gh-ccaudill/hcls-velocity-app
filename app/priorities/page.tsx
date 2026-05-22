"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Target,
  DollarSign,
  Users,
  Building2,
  Clock,
  ExternalLink,
  Plus,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { UseCaseWithDetails, User, UseCaseActivity } from "@/lib/types";

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getPriorityLabel(priority: number | null): string {
  switch (priority) {
    case 1:
      return "P1 - Critical";
    case 2:
      return "P2 - High";
    case 3:
      return "P3 - Medium";
    case 4:
      return "P4 - Low";
    case 5:
      return "P5 - Minimal";
    default:
      return "Not Set";
  }
}

function getPriorityColor(priority: number | null): string {
  switch (priority) {
    case 1:
      return "bg-red-500 text-white";
    case 2:
      return "bg-orange-500 text-white";
    case 3:
      return "bg-yellow-500 text-black";
    case 4:
      return "bg-blue-500 text-white";
    case 5:
      return "bg-gray-500 text-white";
    default:
      return "bg-gray-300";
  }
}

const ACTIVITY_TYPES = [
  "Status Update",
  "Meeting Notes",
  "Technical Discussion",
  "Blocker Identified",
  "Progress Made",
  "Decision Made",
  "Next Steps Defined",
];

export default function PrioritiesPage() {
  const [useCases, setUseCases] = useState<UseCaseWithDetails[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUseCase, setSelectedUseCase] = useState<UseCaseWithDetails | null>(null);
  const [activities, setActivities] = useState<(UseCaseActivity & { USER_NAME: string })[]>([]);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const [newActivity, setNewActivity] = useState({
    activity_type: "",
    description: "",
    user_id: "",
  });

  const fetchUseCases = async () => {
    try {
      const [useCasesRes, usersRes] = await Promise.all([
        fetch("/api/use-cases"),
        fetch("/api/users"),
      ]);
      const useCasesData = await useCasesRes.json();
      const usersData = await usersRes.json();
      setUseCases(Array.isArray(useCasesData) ? useCasesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUseCases();
  }, []);

  const fetchActivities = async (useCaseId: number) => {
    try {
      const res = await fetch(`/api/use-cases/${useCaseId}/activity`);
      const data = await res.json();
      setActivities(data);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    }
  };

  const handleViewDetails = async (useCase: UseCaseWithDetails) => {
    setSelectedUseCase(useCase);
    setDetailsDialogOpen(true);
    await fetchActivities(useCase.ID);
  };

  const handleAddActivity = async () => {
    if (!selectedUseCase || !newActivity.description) return;
    try {
      await fetch(`/api/use-cases/${selectedUseCase.ID}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newActivity,
          user_id: newActivity.user_id || null,
        }),
      });
      setNewActivity({ activity_type: "", description: "", user_id: "" });
      setActivityDialogOpen(false);
      await fetchActivities(selectedUseCase.ID);
      fetchUseCases();
    } catch (error) {
      console.error("Failed to add activity:", error);
    }
  };

  const topPriorities = useCases.filter((uc) => uc.PRIORITY && uc.PRIORITY <= 3);
  const totalValue = topPriorities.reduce((sum, uc) => sum + (uc.ESTIMATED_VALUE || 0), 0);

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-semibold">Priority Use Cases</h1>
        <Badge variant="secondary" className="ml-2">
          P1-P3
        </Badge>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                High Priority Use Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "-" : topPriorities.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pipeline Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "-" : formatCurrency(totalValue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                All Use Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "-" : useCases.length}</div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <Skeleton className="h-6 w-64 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : topPriorities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No High Priority Use Cases</h3>
              <p className="text-muted-foreground">
                Use cases with priority P1-P3 will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {topPriorities.map((uc) => (
              <Card key={uc.ID} className="hover:bg-muted/30 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(uc.PRIORITY)}>
                          {getPriorityLabel(uc.PRIORITY)}
                        </Badge>
                        <h3 className="font-semibold text-lg">{uc.TITLE}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <Link
                          href={`/accounts/${uc.ACCOUNT_ID}`}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <Building2 className="h-4 w-4" />
                          {uc.ACCOUNT_NAME}
                        </Link>
                        {uc.OWNER_NAME && (
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Owner: {uc.OWNER_NAME}
                          </span>
                        )}
                        {uc.ESTIMATED_VALUE && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(uc.ESTIMATED_VALUE)}
                          </span>
                        )}
                        {uc.STAGE && <Badge variant="outline">{uc.STAGE}</Badge>}
                      </div>
                      {uc.DESCRIPTION && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {uc.DESCRIPTION}
                        </p>
                      )}
                      {uc.LATEST_ACTIVITY && (
                        <div className="bg-muted/50 rounded-md p-3 mt-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Clock className="h-3 w-3" />
                            Latest Activity - {formatDate(uc.LATEST_ACTIVITY_DATE)}
                          </div>
                          <p className="text-sm">{uc.LATEST_ACTIVITY}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(uc)}>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Activity
                      </Button>
                      {uc.SALESFORCE_LINK && (
                        <a
                          href={uc.SALESFORCE_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="ghost" className="w-full">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            SFDC
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUseCase && (
                <>
                  <Badge className={getPriorityColor(selectedUseCase.PRIORITY)}>
                    {getPriorityLabel(selectedUseCase.PRIORITY)}
                  </Badge>
                  {selectedUseCase.TITLE}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedUseCase && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {selectedUseCase.ACCOUNT_NAME}
                </span>
                {selectedUseCase.OWNER_NAME && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {selectedUseCase.OWNER_NAME}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Activity Log</h3>
                <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
                  <DialogTrigger render={<Button size="sm" />}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Activity
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log Activity</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Activity Type</Label>
                        <Select
                          value={newActivity.activity_type}
                          onValueChange={(v) =>
                            setNewActivity({ ...newActivity, activity_type: v as string })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVITY_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Logged By</Label>
                        <Select
                          value={newActivity.user_id}
                          onValueChange={(v) => setNewActivity({ ...newActivity, user_id: v as string })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.ID} value={String(user.ID)}>
                                {user.NAME}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="activity-desc">Description *</Label>
                        <Textarea
                          id="activity-desc"
                          value={newActivity.description}
                          onChange={(e) =>
                            setNewActivity({ ...newActivity, description: e.target.value })
                          }
                          placeholder="What happened? What's the status?"
                          rows={4}
                        />
                      </div>
                      <Button onClick={handleAddActivity} className="w-full">
                        Log Activity
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No activity logged yet. Click &quot;Add Activity&quot; to log an update.
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.ID} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {activity.ACTIVITY_TYPE && (
                            <Badge variant="outline">{activity.ACTIVITY_TYPE}</Badge>
                          )}
                          {activity.USER_NAME && (
                            <span className="text-sm text-muted-foreground">
                              by {activity.USER_NAME}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(activity.CREATED_AT)}
                        </span>
                      </div>
                      <p className="text-sm">{activity.DESCRIPTION}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
