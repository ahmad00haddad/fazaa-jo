import { NavLink, useLocation } from "react-router-dom";
import { Home, MessageCircle, Users, Grid3x3, User } from "lucide-react";
import { ReactNode } from "react";

interface Props { children: ReactNode }

const tabs = [
  { to: "/", icon: Home, label: "الرئيسية" },
  { to: "/services", icon: Grid3x3, label: "الخدمات" },
  { to: "/chat", icon: MessageCircle, label: "المساعد" },
  { to: "/fazaa", icon: Users, label: "فزعة" },
  { to: "/me", icon: User, label: "حسابي" },
];

export default function MobileLayout({ children }: Props) {
  const loc = useLocation();
  const hideNav = loc.pathname.startsWith("/service/") || loc.pathname === "/chat";

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[480px] min-h-screen bg-background flex flex-col relative shadow-card">
        <main className={`flex-1 ${hideNav ? "pb-0" : "pb-24"}`}>{children}</main>
        {!hideNav && (
          <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] bg-card/95 backdrop-blur-lg border-t border-border safe-bottom z-40">
            <div className="grid grid-cols-5">
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.to === "/"}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-primary/10" : ""}`}>
                        <t.icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{t.label}</span>
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
