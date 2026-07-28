"use client";

import React, { useMemo } from "react";
import { SidebarIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";

export const SiteHeader = () => {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  const pathItems = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    return segments.map((segment, index) => {
      const title = segment.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
      const path = "/" + segments.slice(0, index + 1).join("/");
      return {
        title,
        path,
      };
    });
  }, [pathname]);

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {pathItems.map((item, index) => (
              <React.Fragment key={item.path}>
                <BreadcrumbItem>
                  {pathItems.length - 1 > index ? (
                    <BreadcrumbLink href={item.path}>{item.title}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.title}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < pathItems.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        {/*
         *
         * NOTE: Placeholder for additional header content
         *
         * */}
      </div>
    </header>
  );
};
