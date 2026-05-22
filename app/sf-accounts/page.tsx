"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, DollarSign, LayoutGrid, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DISTRICT_MAP } from "@/lib/types";

interface SfAccount {
  ACCOUNT_ID: string;
  ACCOUNT_NAME: string;
  DISTRICT_NAME: string | null;
  ACCOUNT_RVP: string | null;
  ACCOUNT_OWNER_NAME: string | null;
  ACCOUNT_LEAD_SE_NAME: string | null;
  USE_CASE_COUNT: number;
  TOTAL_EACV: number;
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

export default function SfAccountsPage() {
  const [accounts, setAccounts] = useState<SfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const districts = useMemo(() => {
    const set = new Set(accounts.map((a) => a.DISTRICT_NAME).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [accounts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return accounts.filter((a) => {
      if (!showAll && a.USE_CASE_COUNT === 0) return false;
      if (districtFilter !== "all" && a.DISTRICT_NAME !== districtFilter) return false;
      if (!q) return true;
      return (
        a.ACCOUNT_NAME.toLowerCase().includes(q) ||
        a.ACCOUNT_OWNER_NAME?.toLowerCase().includes(q) ||
        a.ACCOUNT_LEAD_SE_NAME?.toLowerCase().includes(q)
      );
    });
  }, [accounts, search, districtFilter, showAll]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sf-accounts");
      const data = await res.json();
      if (Array.isArray(data)) setAccounts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white/50 backdrop-blur-sm px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-bold text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Accounts
        </h1>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {loading ? "..." : `${filtered.length} of ${accounts.length} accounts`}
          </span>
          <Button size="sm" variant={showAll ? "secondary" : "outline"} onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Hide zero" : "Show all"}
          </Button>
          <Button size="sm" variant="outline" onClick={fetchAccounts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      {!loading && accounts.length > 0 && (
        <div className="flex items-center gap-3 px-6 py-3 border-b bg-white/30">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Search accounts, AE, or SE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger className="h-8 text-sm w-52">
              <SelectValue placeholder="All districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All districts</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {DISTRICT_MAP[d]?.label || d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No accounts found.</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No accounts match your filters.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((acct) => (
              <Link key={acct.ACCOUNT_ID} href={`/sf-accounts/${acct.ACCOUNT_ID}`}>
                <div className="flex flex-col gap-3 px-4 py-4 rounded-xl border bg-white border-gray-100 hover:border-violet-300 hover:shadow-md hover:shadow-violet-100 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm group-hover:text-violet-700 transition-colors truncate flex-1">
                      {acct.ACCOUNT_NAME}
                    </h3>
                    {acct.DISTRICT_NAME && (
                      <Badge className="text-xs px-1.5 py-0 bg-violet-100 text-violet-700 border-0 shrink-0">
                        {DISTRICT_MAP[acct.DISTRICT_NAME]?.label || acct.DISTRICT_NAME}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {acct.ACCOUNT_OWNER_NAME && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 shrink-0" />
                        <span>AE: <span className="text-foreground">{acct.ACCOUNT_OWNER_NAME}</span></span>
                      </div>
                    )}
                    {acct.ACCOUNT_LEAD_SE_NAME && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 shrink-0" />
                        <span>SE: <span className="text-foreground">{acct.ACCOUNT_LEAD_SE_NAME}</span></span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <LayoutGrid className="h-3 w-3" />
                      <span>{acct.USE_CASE_COUNT} use {acct.USE_CASE_COUNT === 1 ? "case" : "cases"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <DollarSign className="h-3 w-3" />
                      <span>{formatCurrency(acct.TOTAL_EACV)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
