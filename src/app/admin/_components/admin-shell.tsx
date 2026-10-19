"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminHeader } from "./admin-header";
import { AdminMobileDrawer } from "./admin-mobile-drawer";
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
  const closeMobileDrawer = useCallback(() => setIsMobileDrawerOpen(false), []);

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

      {/* Mobile Slide-Over Drawer (scroll lock, Escape and focus handled by DrawerPanel) */}
      <AdminMobileDrawer
        open={isMobileDrawerOpen}
        onClose={closeMobileDrawer}
        adminName={adminProfile?.displayName}
        pendingReviewCount={pendingReviewCount}
      />
    </div>
  );
}
