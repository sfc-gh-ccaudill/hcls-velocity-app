"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Users, Home, Sparkles, LayoutList, GitBranch, Stethoscope, Settings2, ChevronDown, Building2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", href: "/", icon: Home },
  { title: "Team Activity", href: "/team", icon: Users },
  { title: "Accounts", href: "/sf-accounts", icon: Building2 },
  { title: "All Use Cases", href: "/afe-tracker", icon: LayoutList },
  { title: "By District", href: "/afe-tracker/by-district", icon: GitBranch },
  { title: "High Priority", href: "/afe-tracker/priorities", icon: Stethoscope },
  { title: "Manage Use Cases", href: "/afe-tracker/manage", icon: Settings2 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <Sidebar className="border-r-0">
      <div className="absolute inset-0 bg-gradient-to-b from-violet-600 via-purple-700 to-indigo-900" />
      <SidebarHeader className="relative border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white tracking-tight">HCLS AI Tracker</span>
            <span className="text-xs text-white/60">Account Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="relative">
        <SidebarGroup className="pt-4">
          <SidebarGroupLabel
            className="text-white/40 text-xs px-4 mb-1 flex items-center justify-between cursor-pointer hover:text-white/70 transition-colors select-none"
            onClick={() => setOpen(o => !o)}
          >
            <span className="flex items-center gap-1.5">
              Account Management
              <span className="text-white/30 font-mono text-[10px]">#ai</span>
            </span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
          </SidebarGroupLabel>
          {open && (
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={pathname === item.href}
                      className="mx-2 rounded-xl text-white/80 hover:bg-white/15 hover:text-white data-[active=true]:bg-white/20 data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-black/10"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="relative border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-bold text-white">
            HC
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">HCLS Strategics Team</span>
            <span className="text-xs text-white/50">US Majors</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
