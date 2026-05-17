import { ReactNode } from "react";
import { Clock, Home, ListChecks, MessageCircleMore, User, Users } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useRealtimeFazaa } from "@/hooks/useRealtimeFazaa";

interface Props {
  children: ReactNode;
}

const tabs = [
  { to: "/", icon: Home, label: "الرئيسية" },
  { to: "/services", icon: ListChecks, label: "الطلبات" },
  { to: "/chat", icon: MessageCircleMore, label: "المساعد" },
  { to: "/fazaa", icon: Users, label: "اطلب فزعة" },
  { to: "/me", icon: User, label: "حسابي" },
];

export default function MobileLayout({ children }: Props) {
  useRealtimeFazaa();
  const location = useLocation();
  const hideNav = location.pathname === "/chat";

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="relative min-h-screen w-full max-w-[480px] bg-background flex flex-col shadow-card">
        <main className={`flex-1 ${hideNav ? "pb-0" : "pb-24"}`}>{children}</main>
        {!hideNav && (
          <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] border-t border-border bg-card/95 backdrop-blur-lg safe-bottom z-40">
            <div className="grid grid-cols-5">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.to === "/"}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`rounded-2xl p-1.5 transition ${isActive ? "bg-primary/10" : ""}`}>
                        <tab.icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{tab.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
