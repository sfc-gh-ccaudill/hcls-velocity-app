"use client";

import { useEffect, useState } from "react";
import { Calendar, User, Building2, Briefcase, Plus, Trash2, UserPlus, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User as UserType } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TeamActivity {
  USER_ID: number;
  USER_NAME: string;
  ACCOUNT_ID: number;
  ACCOUNT_NAME: string;
  ACTIVITY_TYPE: string;
  ACTIVITY_TITLE: string;
  ACTIVITY_DATE: string;
  ACTIVITY_DESCRIPTION: string | null;
}

interface GroupedActivities {
  [userName: string]: TeamActivity[];
}

interface NewUserResponse {
  user: UserType;
  snowflake_user: string;
  temp_password: string;
  message: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function TeamActivityPage() {
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdUser, setCreatedUser] = useState<NewUserResponse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const fetchData = async () => {
    try {
      const [activityRes, usersRes] = await Promise.all([
        fetch(`/api/team-activity?weekOffset=${weekOffset}`),
        fetch("/api/users"),
      ]);
      const activityData = await activityRes.json();
      const usersData = await usersRes.json();
      setActivities(Array.isArray(activityData) ? activityData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setActivities([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [weekOffset]);

  const handleCreateUser = async () => {
    if (!newUserName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUserName, email: newUserEmail || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedUser(data);
        fetchData();
      } else {
        alert(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (user: UserType) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/users?id=${user.ID}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const resetAddDialog = () => {
    setNewUserName("");
    setNewUserEmail("");
    setCreatedUser(null);
    setAddDialogOpen(false);
  };

  const groupedByUser: GroupedActivities = activities.reduce((acc, activity) => {
    if (!acc[activity.USER_NAME]) {
      acc[activity.USER_NAME] = [];
    }
    acc[activity.USER_NAME].push(activity);
    return acc;
  }, {} as GroupedActivities);

  const allUsers = users.map((u) => u.NAME);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekOffset * 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekRange = `${weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-semibold">Team</h1>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="members">Manage Members</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setWeekOffset(weekOffset - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Badge variant="secondary" className="px-3 py-1">
                  {weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : weekRange}
                </Badge>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setWeekOffset(weekOffset + 1)}
                  disabled={weekOffset >= 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {weekOffset !== 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
                    Today
                  </Button>
                )}
              </div>
              <span className="text-sm text-muted-foreground">{weekRange}</span>
            </div>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {allUsers.map((userName) => {
                  const userActivities = groupedByUser[userName] || [];
                  return (
                    <Card key={userName} className="h-fit">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className={getAvatarColor(userName)}>
                            <AvatarFallback className="text-white bg-transparent">
                              {getInitials(userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{userName}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {userActivities.length} activit{userActivities.length === 1 ? "y" : "ies"}{" "}
                              {weekOffset === 0 ? "this week" : ""}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {userActivities.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground text-sm">
                            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            No activity logged {weekOffset === 0 ? "this week" : ""}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {userActivities.map((activity, idx) => (
                              <div
                                key={idx}
                                className="border rounded-lg p-3 space-y-2 bg-muted/30"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-medium text-sm line-clamp-2">
                                    {activity.ACTIVITY_TITLE}
                                  </span>
                                  <Badge variant="outline" className="shrink-0 text-xs">
                                    {activity.ACTIVITY_TYPE}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {activity.ACCOUNT_NAME}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(activity.ACTIVITY_DATE)}
                                  </span>
                                </div>
                                {activity.ACTIVITY_DESCRIPTION && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {activity.ACTIVITY_DESCRIPTION}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {!loading && activities.length === 0 && (
              <Card className="mt-6">
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Team Activity {weekOffset === 0 ? "This Week" : ""}</h3>
                  <p className="text-muted-foreground">
                    Events and use case updates logged {weekOffset === 0 ? "this week" : "during this period"} will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Team Members</h2>
                <p className="text-sm text-muted-foreground">
                  Add or remove team members. Each member gets a Snowflake account with app access.
                </p>
              </div>
              <Dialog open={addDialogOpen} onOpenChange={(open) => { if (!open) resetAddDialog(); else setAddDialogOpen(true); }}>
                <DialogTrigger render={<Button className="bg-gradient-to-r from-violet-600 to-indigo-600" />}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                  </DialogHeader>
                  {createdUser ? (
                    <div className="space-y-4 pt-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">User Created Successfully!</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Name:</strong> {createdUser.user.NAME}</p>
                          <p><strong>Snowflake User:</strong> {createdUser.snowflake_user}</p>
                          <p><strong>Temporary Password:</strong> <code className="bg-white px-2 py-1 rounded">{createdUser.temp_password}</code></p>
                        </div>
                        <p className="text-xs text-green-700 mt-3">
                          Share these credentials with the user. They must change their password on first login.
                        </p>
                      </div>
                      <Button onClick={resetAddDialog} className="w-full">Done</Button>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input 
                          id="name" 
                          value={newUserName} 
                          onChange={(e) => setNewUserName(e.target.value)} 
                          placeholder="e.g., Sarah Johnson"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email (optional)</Label>
                        <Input 
                          id="email" 
                          type="email"
                          value={newUserEmail} 
                          onChange={(e) => setNewUserEmail(e.target.value)} 
                          placeholder="sarah@company.com"
                        />
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                        <p>This will create:</p>
                        <ul className="list-disc list-inside mt-1">
                          <li>A team member in this app</li>
                          <li>A Snowflake user account with app-only access</li>
                        </ul>
                      </div>
                      <Button 
                        onClick={handleCreateUser} 
                        disabled={!newUserName.trim() || creating}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                      >
                        {creating ? "Creating..." : "Add Member"}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <Card key={user.ID}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className={getAvatarColor(user.NAME)}>
                            <AvatarFallback className="text-white bg-transparent">
                              {getInitials(user.NAME)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{user.NAME}</h3>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              {user.EMAIL && <span>{user.EMAIL}</span>}
                              {user.SNOWFLAKE_USER && (
                                <Badge variant="outline" className="text-xs">
                                  {user.SNOWFLAKE_USER}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteConfirm(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Remove Team Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p>
              Are you sure you want to remove <strong>{deleteConfirm?.NAME}</strong>?
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <p>This will:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Remove them from this app</li>
                <li>Delete their Snowflake user account</li>
                <li>Unassign them from any action items</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleting}
                onClick={() => deleteConfirm && handleDeleteUser(deleteConfirm)}
              >
                {deleting ? "Removing..." : "Remove Member"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
