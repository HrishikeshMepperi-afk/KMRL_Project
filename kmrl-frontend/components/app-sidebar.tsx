"use client"

import * as React from "react"
import {
  IconDashboard,
  IconUsers,
  IconTrain,
  IconCalendarEvent,
  IconChartBar,
  IconFileReport,
  IconFileText,
  IconDatabase,
  IconSettings,
  IconHelp,
  IconSearch,
} from "@tabler/icons-react"

import Link from "next/link"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "KMRL Admin",
    email: "admin@kmrl.in",
    avatar: "/avatars/kmrl.jpg",
  },
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: IconDashboard },
    { title: "KPIs", url: "/kpis", icon: IconChartBar },
    { title: "Fleet Status", url: "/fleet", icon: IconUsers },
    { title: "Train Assignment", url: "/train-assignment", icon: IconTrain },
    { title: "Service Schedule", url: "/schedule", icon: IconCalendarEvent },
    { title: "Conflict Alerts", url: "/conflict-alerts", icon: IconFileReport },
    { title: "Operations Notes", url: "/operations-notes", icon: IconFileText },
    { title: "Staff Management", url: "/staff-management", icon: IconUsers },
  ],
  navSecondary: [
    { title: "Settings", url: "/settings", icon: IconSettings },
    { title: "Get Help", url: "/help", icon: IconHelp },
    { title: "Search", url: "/search", icon: IconSearch },
  ],
  documents: [
    { name: "Reports", url: "/reports", icon: IconFileReport },
    { name: "Data Library", url: "/library", icon: IconDatabase },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <span className="text-base font-semibold">KMRL Control Panel</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
