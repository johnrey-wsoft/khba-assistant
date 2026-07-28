"use client";

import * as React from "react";
import { Command } from "lucide-react";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/app-sidebar/nav-user";

import { NavItems } from "./nav-items";
import { NavDrawer } from "./nav-drawer";

import { APP_SIDEBAR_ITEMS } from "@/constants/app-sidebar-items.constant";

import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";

export const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const { profile, isLoading } = useAuth();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
      toast.error("Sign out failed", { description: "Please try again." });
    }
  };

  return (
    <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">NextBase</span>
                  <span className="truncate text-xs">Next.js + Supabase</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavItems {...APP_SIDEBAR_ITEMS.platform} />
        <NavDrawer title={APP_SIDEBAR_ITEMS.drawer.title} items={APP_SIDEBAR_ITEMS.drawer.items} />
        <NavItems {...APP_SIDEBAR_ITEMS.secondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser profile={profile} handleSignOut={handleSignOut} isLoading={isLoading} />
      </SidebarFooter>
    </Sidebar>
  );
};
