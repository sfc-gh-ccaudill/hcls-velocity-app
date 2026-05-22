"use client";

import { useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft, DollarSign, Users, Calendar, ChevronRight,
  Search, ArrowUpDown, ArrowUp, ArrowDown, Plus, Trash2,
  ClipboardList, MessageSquare,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DISTRICT_MAP } from "@/lib/types";

interface SfUseCase {
  USE_CASE_ID: string;
  USE_CASE_NAME: string;
  USE_CASE_NUMBER: string;
  USE_CASE_STAGE: string | null;
  USE_CASE_EACV: number | null;
  USE_CASE_STATUS: string | null;
  USE_CASE_DESCRIPTION: string | null;
  NEXT_STEPS: string | null;
  DECISION_DATE: string | null;
  TECHNICAL_WIN: string | null;
  ACCOUNT_ID: string;
  ACCOUNT_NAME: string;
  DISTRICT_NAME: string | null;
  ACCOUNT_RVP: string | null;
  ACCOUNT_OWNER_NAME: string | null;
  ACCOUNT_LEAD_SE_NAME: string | null;
  USE_CASE_LEAD_SE_NAME: string | null;
  OWNER_NAME: string | null;
  IS_WON: boolean | null;
  IS_TECH_WON: boolean | null;
  DAYS_IN_STAGE: number | null;
  CREATED_DATE: string | null;
  LAST_MODIFIED_DATE: string | null;
  WORKLOADS: string | null;
}

interface VelocityUser {
  ID: number;
  NAME: string;
  EMAIL: string | null;
}

interface Activity {
  ID: number;
  SF_ACCOUNT_ID: string;
  SF_USE_CASE_ID: string | null;
  REPORTED_BY_ID: number | null;
  REPORTED_BY_NAME: string | null;
  TITLE: string;
  EVENT_TYPE: string;
  LOCATION_TYPE: string;
  EVENT_DATE: string;
  EVENT_TIME: string | null;
  ATTENDEES: string | null;
  OBJECTIVE: string | null;
  NOTES: string | null;
  CREATED_AT: string;
}

type SortKey = "name-asc" | "name-desc" | "eacv-desc" | "eacv-asc" | "stage" | "modified";

const EVENT_TYPES = ["Meeting", "Workshop", "Demo", "Call", "Training", "Review", "Conversation", "Document", "Other"];
const LOCATION_TYPES = ["Virtual", "On-site"];

function makeEmptyForm() {
  return {
    title: "",
    event_type: "",
    location_type: "",
    event_date: new Date().toISOString().split("T")[0],
    event_time: "",
    attendees: "",
    objective: "",
    notes: "",
    reported_by_id: "",
  };
}

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

function formatDateTime(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getStageNumber(stage: string | null): number {
  if (!stage) return 99;
  const n = parseInt(stage.charAt(0), 10);
  return isNaN(n) ? 99 : n;
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

function LogActivityDialog({
  sfAccountId,
  sfUseCaseId,
  sfUseCaseName,
  users,
  onLogged,
  trigger,
}: {
  sfAccountId: string;
  sfUseCaseId?: string;
  sfUseCaseName?: string;
  users: VelocityUser[];
  onLogged: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(makeEmptyForm);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = form.title.trim() && form.event_type && form.location_type && form.event_date;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const reporter = users.find((u) => String(u.ID) === form.reported_by_id);
      await fetch("/api/sf-accounts/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sf_account_id: sfAccountId,
          sf_use_case_id: sfUseCaseId || null,
          reported_by_id: reporter?.ID || null,
          reported_by_name: reporter?.NAME || null,
          title: form.title,
          event_type: form.event_type,
          location_type: form.location_type,
          event_date: form.event_date,
          event_time: form.event_time || null,
          attendees: form.attendees || null,
          objective: form.objective || null,
          notes: form.notes || null,
        }),
      });
      setForm(makeEmptyForm());
      setOpen(false);
      onLogged();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-full max-w-3xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>
        {sfUseCaseName && (
          <div className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-2 text-sm">
            <span className="text-xs text-muted-foreground">Use Case: </span>
            <span className="font-medium text-violet-700">{sfUseCaseName}</span>
          </div>
        )}
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Quarterly Business Review"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Location *</Label>
              <Select value={form.location_type} onValueChange={(v) => setForm({ ...form, location_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reported By</Label>
              <Select
                value={form.reported_by_id}
                onValueChange={(v) => setForm({ ...form, reported_by_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.ID} value={String(u.ID)}>{u.NAME}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Attendees</Label>
              <Input
                value={form.attendees}
                onChange={(e) => setForm({ ...form, attendees: e.target.value })}
                placeholder="e.g., John Smith, Jane Doe"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Objective</Label>
            <Textarea
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              placeholder="What was the goal or agenda?"
              rows={5}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Key takeaways, action items, follow-ups..."
              rows={8}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
          >
            {submitting ? "Saving..." : "Log Activity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActivityFeed({
  activities,
  loading,
  onDelete,
  emptyMessage,
}: {
  activities: Activity[];
  loading: boolean;
  onDelete: (id: number) => void;
  emptyMessage: string;
}) {
  if (loading) {
    return <div className="space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>;
  }
  if (activities.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">{emptyMessage}</p>;
  }
  return (
    <div className="space-y-2">
      {activities.map((act) => (
        <div key={act.ID} className="rounded-lg border bg-white px-3 py-2.5 group">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">{act.TITLE}</span>
                <Badge className={`text-xs px-1.5 py-0 ${getEventTypeColor(act.EVENT_TYPE)}`}>{act.EVENT_TYPE}</Badge>
                <Badge variant="outline" className="text-xs px-1.5 py-0">{act.LOCATION_TYPE}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(act.EVENT_DATE)}
                </span>
                {act.REPORTED_BY_NAME && (
                  <span className="font-medium text-foreground">{act.REPORTED_BY_NAME}</span>
                )}
              {act.ATTENDEES && <span>{act.ATTENDEES}</span>}
              </div>
              {act.OBJECTIVE && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{act.OBJECTIVE}</p>
              )}
            </div>
            <button
              onClick={() => onDelete(act.ID)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 shrink-0 mt-0.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SfAccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = use(params);
  const [useCases, setUseCases] = useState<SfUseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SfUseCase | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name-asc");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [velocityUsers, setVelocityUsers] = useState<VelocityUser[]>([]);

  const fetchUseCases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sf-accounts/${accountId}`);
      const data = await res.json();
      if (Array.isArray(data)) setUseCases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const res = await fetch(`/api/sf-accounts/activity?account_id=${accountId}`);
      const data = await res.json();
      if (Array.isArray(data)) setActivities(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleDeleteActivity = async (id: number) => {
    try {
      await fetch(`/api/sf-accounts/activity?id=${id}`, { method: "DELETE" });
      setActivities((prev) => prev.filter((a) => a.ID !== id));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUseCases();
    fetchActivities();
    fetch("/api/sf-accounts/users")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setVelocityUsers(d); })
      .catch(console.error);
  }, [accountId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const base = useCases.filter((uc) => {
      const stage = getStageNumber(uc.USE_CASE_STAGE);
      if (stage === 7 || stage === 8) return false;
      if (!uc.WORKLOADS || !/(^|.*;)AI(;.*|$)/.test(uc.WORKLOADS)) return false;
      if (!q) return true;
      return (
        uc.USE_CASE_NAME?.toLowerCase().includes(q) ||
        uc.USE_CASE_NUMBER?.toLowerCase().includes(q)
      );
    });
    return [...base].sort((a, b) => {
      switch (sortKey) {
        case "name-asc": return (a.USE_CASE_NAME ?? "").localeCompare(b.USE_CASE_NAME ?? "");
        case "name-desc": return (b.USE_CASE_NAME ?? "").localeCompare(a.USE_CASE_NAME ?? "");
        case "eacv-desc": return (b.USE_CASE_EACV ?? 0) - (a.USE_CASE_EACV ?? 0);
        case "eacv-asc": return (a.USE_CASE_EACV ?? 0) - (b.USE_CASE_EACV ?? 0);
        case "stage": return getStageNumber(a.USE_CASE_STAGE) - getStageNumber(b.USE_CASE_STAGE);
        case "modified": return (b.LAST_MODIFIED_DATE ?? "").localeCompare(a.LAST_MODIFIED_DATE ?? "");
        default: return 0;
      }
    });
  }, [useCases, search, sortKey]);

  useEffect(() => {
    if (filtered.length > 0 && !filtered.find((uc) => uc.USE_CASE_ID === selected?.USE_CASE_ID)) {
      setSelected(filtered[0]);
    }
    if (filtered.length === 0) setSelected(null);
  }, [filtered]);

  const account = useCases[0] ?? null;
  const totalEacv = filtered.reduce((s, uc) => s + (uc.USE_CASE_EACV || 0), 0);

  const useCaseActivities = useMemo(
    () => activities.filter((a) => a.SF_USE_CASE_ID === selected?.USE_CASE_ID),
    [activities, selected]
  );

  const accountActivities = useMemo(
    () => activities.filter((a) => !a.SF_USE_CASE_ID),
    [activities]
  );

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white/50 backdrop-blur-sm px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Link href="/sf-accounts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        {account && (
          <>
            <h1 className="font-bold text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {account.ACCOUNT_NAME}
            </h1>
            {account.DISTRICT_NAME && (
              <Badge className="ml-2 bg-violet-100 text-violet-700 border-0 text-xs">
                {DISTRICT_MAP[account.DISTRICT_NAME]?.label || account.DISTRICT_NAME}
              </Badge>
            )}
          </>
        )}
      </header>

      {loading ? (
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="flex gap-6 flex-1">
            <Skeleton className="h-96 w-96 rounded-xl shrink-0" />
            <Skeleton className="h-96 flex-1 rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-6 min-h-0">
          {account && (
            <div className="shrink-0 rounded-xl border bg-gradient-to-br from-white to-violet-50/30 px-5 py-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm flex-1">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">RVP</p>
                    <p className="font-medium">{account.ACCOUNT_RVP || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Users className="h-3 w-3" /> Account Executive
                    </p>
                    <p className="font-medium">{account.ACCOUNT_OWNER_NAME || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Users className="h-3 w-3" /> Lead SE
                    </p>
                    <p className="font-medium">{account.ACCOUNT_LEAD_SE_NAME || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Total EACV
                    </p>
                    <p className="font-semibold text-emerald-600">{formatCurrency(totalEacv)}</p>
                  </div>
                </div>
                <LogActivityDialog
                  sfAccountId={accountId}
                  users={velocityUsers}
                  onLogged={fetchActivities}
                  trigger={
                    <Button size="sm" variant="outline" className="shrink-0">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Log Account Activity
                    </Button>
                  }
                />
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 flex gap-6">
            <div className="w-96 shrink-0 flex flex-col min-h-0 gap-2">
              <div className="shrink-0 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search use cases..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">
                        <span className="flex items-center gap-1.5"><ArrowUp className="h-3 w-3" />Name A→Z</span>
                      </SelectItem>
                      <SelectItem value="name-desc">
                        <span className="flex items-center gap-1.5"><ArrowDown className="h-3 w-3" />Name Z→A</span>
                      </SelectItem>
                      <SelectItem value="eacv-desc">
                        <span className="flex items-center gap-1.5"><ArrowDown className="h-3 w-3" />EACV High→Low</span>
                      </SelectItem>
                      <SelectItem value="eacv-asc">
                        <span className="flex items-center gap-1.5"><ArrowUp className="h-3 w-3" />EACV Low→High</span>
                      </SelectItem>
                      <SelectItem value="stage">
                        <span className="flex items-center gap-1.5"><ArrowUp className="h-3 w-3" />Stage</span>
                      </SelectItem>
                      <SelectItem value="modified">
                        <span className="flex items-center gap-1.5"><ArrowDown className="h-3 w-3" />Last Modified</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground shrink-0">{filtered.length}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filtered.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No use cases match.</p>
                ) : (
                  filtered.map((uc) => {
                    const ucActivityCount = activities.filter((a) => a.SF_USE_CASE_ID === uc.USE_CASE_ID).length;
                    return (
                      <div
                        key={uc.USE_CASE_ID}
                        onClick={() => setSelected(uc)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all cursor-pointer ${
                          selected?.USE_CASE_ID === uc.USE_CASE_ID
                            ? "bg-violet-50 border-violet-300 shadow-sm"
                            : "bg-white border-gray-100 hover:border-violet-200"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{uc.USE_CASE_NAME}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {uc.USE_CASE_NUMBER && (
                              <span className="text-xs text-muted-foreground font-mono">{uc.USE_CASE_NUMBER}</span>
                            )}
                            {uc.USE_CASE_STAGE && (
                              <Badge variant="outline" className="text-xs px-1 py-0">{uc.USE_CASE_STAGE}</Badge>
                            )}
                            {uc.USE_CASE_EACV != null && (
                              <span className="text-xs text-emerald-600 font-medium">{formatCurrency(uc.USE_CASE_EACV)}</span>
                            )}
                            {ucActivityCount > 0 && (
                              <span className="text-xs text-violet-500 flex items-center gap-0.5">
                                <MessageSquare className="h-2.5 w-2.5" />{ucActivityCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${
                          selected?.USE_CASE_ID === uc.USE_CASE_ID ? "text-violet-500" : "text-gray-300"
                        }`} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 overflow-y-auto">
              {selected ? (
                <div className="rounded-xl border bg-white shadow-sm p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-bold text-base leading-snug">{selected.USE_CASE_NAME}</h2>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{selected.USE_CASE_NUMBER}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {selected.USE_CASE_STAGE && (
                        <Badge variant="outline">{selected.USE_CASE_STAGE}</Badge>
                      )}
                      {selected.IS_WON && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0">Won</Badge>
                      )}
                      {selected.IS_TECH_WON && (
                        <Badge className="bg-blue-100 text-blue-700 border-0">Tech Won</Badge>
                      )}
                      <LogActivityDialog
                        sfAccountId={accountId}
                        sfUseCaseId={selected.USE_CASE_ID}
                        sfUseCaseName={selected.USE_CASE_NAME}
                        users={velocityUsers}
                        onLogged={fetchActivities}
                        trigger={
                          <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 h-7 text-xs">
                            <Plus className="h-3 w-3 mr-1" />
                            Log Activity
                          </Button>
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">EACV</p>
                      <p className="font-semibold text-emerald-600">{formatCurrency(selected.USE_CASE_EACV)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <p className="font-medium">{selected.USE_CASE_STATUS || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Users className="h-3 w-3" /> AE
                      </p>
                      <p className="font-medium">{selected.ACCOUNT_OWNER_NAME || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Lead SE
                      </p>
                      <p className="font-medium">{selected.USE_CASE_LEAD_SE_NAME || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Decision Date
                      </p>
                      <p className="font-medium">{formatDate(selected.DECISION_DATE)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Days in Stage</p>
                      <p className="font-medium">{selected.DAYS_IN_STAGE ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Created
                      </p>
                      <p className="font-medium">{formatDate(selected.CREATED_DATE)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Last Modified
                      </p>
                      <p className="font-medium">{formatDate(selected.LAST_MODIFIED_DATE)}</p>
                    </div>
                  </div>

                  {selected.USE_CASE_DESCRIPTION && (
                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">DESCRIPTION</p>
                      <p className="text-sm leading-relaxed">{selected.USE_CASE_DESCRIPTION}</p>
                    </div>
                  )}

                  {selected.NEXT_STEPS && (
                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">NEXT STEPS</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.NEXT_STEPS}</p>
                    </div>
                  )}

                  {selected.TECHNICAL_WIN && (
                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">TECHNICAL WIN</p>
                      <p className="text-sm leading-relaxed">{selected.TECHNICAL_WIN}</p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5" />
                        ACTIVITY ({useCaseActivities.length})
                      </p>
                    </div>
                    <ActivityFeed
                      activities={useCaseActivities}
                      loading={loadingActivities}
                      onDelete={handleDeleteActivity}
                      emptyMessage="No activity logged for this use case yet."
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5" />
                      ACCOUNT ACTIVITY ({accountActivities.length})
                    </p>
                    <LogActivityDialog
                      sfAccountId={accountId}
                      users={velocityUsers}
                      onLogged={fetchActivities}
                      trigger={
                        <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 h-7 text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Log Activity
                        </Button>
                      }
                    />
                  </div>
                  <ActivityFeed
                    activities={accountActivities}
                    loading={loadingActivities}
                    onDelete={handleDeleteActivity}
                    emptyMessage="No account-level activity logged yet."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
