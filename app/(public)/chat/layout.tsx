"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ThreadList } from "@/components/chat/thread-list";
import { ChatShellProvider } from "@/components/chat/chat-shell-context";
import { ChatStoreProvider } from "@/components/chat/chat-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function ChatLayout({ children }: PropsWithChildren) {
  const params = useParams();
  const activeId = typeof params.id === "string" ? params.id : null;

  const isMobile = useIsMobile();
  // Desktop keeps the inline column open by default; the mobile drawer starts closed.
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filter, setFilter] = useState("");

  // One toggle button in the header, routed by viewport: drawer on mobile,
  // collapsible column on desktop.
  const toggleThreadList = () => {
    if (isMobile) setMobileOpen((v) => !v);
    else setDesktopOpen((v) => !v);
  };

  // Close the mobile drawer on Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <ChatShellProvider toggleThreadList={toggleThreadList}>
      <ChatStoreProvider>
        <div className="flex h-svh min-w-0 overflow-hidden bg-background">
          {/* Desktop / tablet: inline collapsible column (md = 768px, matches useIsMobile). */}
          <div
            className={cn(
              "hidden h-full w-[300px] flex-none md:block",
              !desktopOpen && "md:hidden"
            )}
          >
            <ThreadList activeId={activeId} filter={filter} onFilterChange={setFilter} />
          </div>

          {/* Mobile: slide-in drawer overlay (never shown at md+). */}
          {mobileOpen && (
            <div className="md:hidden">
              <div
                onClick={() => setMobileOpen(false)}
                aria-hidden
                className="fixed inset-0 z-40 bg-black/50 duration-200 animate-in fade-in"
              />
              <div className="fixed inset-y-0 left-0 z-50 w-[300px] max-w-[85vw] shadow-xl duration-200 animate-in slide-in-from-left-4 fade-in">
                <ThreadList
                  activeId={activeId}
                  filter={filter}
                  onFilterChange={setFilter}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </div>
          )}

          <section className="flex h-full min-w-0 flex-1 overflow-hidden bg-card">
            {children}
          </section>
        </div>
      </ChatStoreProvider>
    </ChatShellProvider>
  );
}
