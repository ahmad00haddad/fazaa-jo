import { ReactNode } from "react";
import { Clock, Home, ListChecks, User, Users } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useRealtimeFazaa } from "@/hooks/useRealtimeFazaa";

interface Props {
  children: ReactNode;
}

const tabs = [
  { to: "/",        icon: Home,        label: "الرئيسية" },
  { to: "/services", icon: ListChecks,  label: "الطلبات"  },
  { to: "/fazaa",   icon: Users,       label: "فزعة"     },
  { to: "/history", icon: Clock,       label: "سجلّي"    },
  { to: "/me",      icon: User,        label: "حسابي"    },
];

export default function MobileLayout({ children }: Props) {
  useRealtimeFazaa();
  const location = useLocation();
  const hideNav = location.pathname === "/chat";

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="relative min-h-screen w-full max-w-[480px] bg-background flex flex-col shadow-card">
        <main className={`flex-1 ${hideNav ? "pb-0" : "pb-24"} no-scrollbar`}>{children}</main>

        {!hideNav && (
          <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] border-t border-border/60 glass safe-bottom z-40">
            <div className="grid grid-cols-5">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.to === "/"}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-all duration-200 min-h-[56px] ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground/70"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`rounded-xl p-1.5 transition-all duration-200 ${
                          isActive
                            ? "bg-primary/12 shadow-soft scale-110"
                            : "scale-100"
                        }`}
                      >
                        <tab.icon
                          className={`transition-all duration-200 ${
                            isActive ? "w-5 h-5 stroke-[2.2]" : "w-5 h-5 stroke-[1.8]"
                          }`}
                        />
                      </div>
                      <span className={`transition-all duration-200 ${isActive ? "font-bold" : "font-medium"}`}>
                        {tab.label}
                      </span>
                      {isActive && (
                        <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-primary" />
                      )}
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
