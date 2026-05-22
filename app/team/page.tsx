"use client";

import { useEffect, useState, useMemo } from "react";
import { Calendar, User, Building2, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface TeamActivity {
  REPORTED_BY_ID: number | null;
  REPORTED_BY_NAME: string | null;
  SF_ACCOUNT_ID: string;
  ACCOUNT_NAME: string | null;
  EVENT_TYPE: string;
  TITLE: string;
  EVENT_DATE: string;
  OBJECTIVE: string | null;
  NOTES: string | null;
}

interface VelocityUser {
  ID: number;
  NAME: string;
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

function getEventTypeColor(type: string): string {
  switch (type) {
    case "Meeting": return "bg-blue-100 text-blue-700 border-0";
    case "Demo": return "bg-violet-100 text-violet-700 border-0";
    case "Call": return "bg-cyan-100 text-cyan-700 border-0";
    case "Workshop": return "bg-amber-100 text-amber-700 border-0";
    case "Training": return "bg-green-100 text-green-700 border-0";
    case "Review": return "bg-orange-100 text-orange-700 border-0";
    default: return "bg-gray-100 text-gray-600 border-0";
  }
}

export default function TeamActivityPage() {
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [users, setUsers] = useState<VelocityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const fetchData = async () => {
    setLoading(true);
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

  const groupedByUser = useMemo(() => {
    const groups: Record<string, TeamActivity[]> = {};
    for (const act of activities) {
      const key = act.REPORTED_BY_NAME || "Unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(act);
    }
    return groups;
  }, [activities]);

  const allNames = useMemo(() => {
    const nameSet = new Set<string>();
    users.forEach((u) => nameSet.add(u.NAME));
    activities.forEach((a) => { if (a.REPORTED_BY_NAME) nameSet.add(a.REPORTED_BY_NAME); });
    return Array.from(nameSet).sort();
  }, [users, activities]);

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
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white/50 backdrop-blur-sm px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-bold text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Team Activity
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
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
            className="h-8 w-8"
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
          <span className="text-xs text-muted-foreground ml-2">{weekRange}</span>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
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
            {allNames.map((userName) => {
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
                                {activity.TITLE}
                              </span>
                              <Badge className={`shrink-0 text-xs px-1.5 py-0 ${getEventTypeColor(activity.EVENT_TYPE)}`}>
                                {activity.EVENT_TYPE}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {activity.ACCOUNT_NAME && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {activity.ACCOUNT_NAME}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(activity.EVENT_DATE)}
                              </span>
                            </div>
                            {activity.OBJECTIVE && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {activity.OBJECTIVE}
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
                Activities logged {weekOffset === 0 ? "this week" : "during this period"} will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
