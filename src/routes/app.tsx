import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/chat/Sidebar";
import { MobileBottomNav } from "@/components/chat/MobileBottomNav";
import { UpdateAnnouncement } from "@/components/UpdateAnnouncement";
import { PlatformBanner } from "@/components/PlatformBanner";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isChatThread = location.pathname.startsWith("/app/c/");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-screen flex bg-background overflow-hidden">
      <div className="hidden md:flex"><Sidebar /></div>
      <main className={`flex-1 min-w-0 min-h-0 flex flex-col ${isChatThread ? "pb-0" : "pb-[60px] md:pb-0"}`}>
        {!isChatThread && <PlatformBanner />}
        <Outlet />
      </main>
      {!isChatThread && <MobileBottomNav />}
      <UpdateAnnouncement />
    </div>
  );
}
