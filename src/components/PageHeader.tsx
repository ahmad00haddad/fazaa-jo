import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "@/lib/fazaa";

interface Props { title: string; subtitle?: string; children?: ReactNode; back?: boolean }

function NotificationBell() {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user?.id && location.pathname !== "/notifications",
    refetchInterval: 15000,
  });

  if (location.pathname === "/notifications") return null;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <button onClick={() => nav("/notifications")} className="relative w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center -ml-2">
      <Bell className="w-5 h-5 text-foreground" />
      {unreadCount > 0 && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm"></span>
      )}
    </button>
  );
}

export default function PageHeader({ title, subtitle, children, back = true }: Props) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border safe-top">
      <div className="flex items-center gap-3 px-4 h-14">
        {back && (
          <button
            onClick={() => nav(-1)}
            className="w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center -mr-2"
            aria-label="رجوع"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-base truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
        {children}
        <NotificationBell />
      </div>
    </header>
  );
}
