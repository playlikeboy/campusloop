"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

interface AdminShellProps {
  children: React.ReactNode;
  adminProfile?: {
    displayName?: string | null;
    username?: string | null;
    email?: string | null;
    role?: string | null;
    avatarUrl?: string | null;
  } | null;
  pendingReviewCount?: number;
}

export function AdminShell({
  children,
  adminProfile,
  pendingReviewCount = 0,
}: AdminShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Auto-collapse sidebar on smaller tablet screens
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 1024 && window.innerWidth >= 768) {
        setIsSidebarCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setIsSidebarCollapsed(false);
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileDrawerOpen]);

  return (
    <div className="relative min-h-screen bg-background flex text-foreground antialiased selection:bg-primary/20">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block shrink-0 sticky top-0 h-screen z-20">
        <AdminSidebar isCollapsed={isSidebarCollapsed} />
      </div>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        <AdminHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          adminProfile={adminProfile}
          pendingReviewCount={pendingReviewCount}
        />

        <main className="flex-1 w-full min-w-0 p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Slide-Over Drawer */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div
            className="w-[82%] max-w-xs h-full bg-card shadow-2xl border-r border-border animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminSidebar
              isMobileDrawer
              onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
