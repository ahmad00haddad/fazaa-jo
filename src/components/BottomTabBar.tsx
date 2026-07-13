import { Clock, Home, ListChecks, User, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const tabs = [
  { to: "/",        icon: Home,        label: "الرئيسية" },
  { to: "/services", icon: ListChecks,  label: "الطلبات"  },
  { to: "/fazaa",   icon: Users,       label: "فزعة"     },
  { to: "/history", icon: Clock,       label: "سجلّي"    },
  { to: "/me",      icon: User,        label: "حسابي"    },
];

export default function BottomTabBar() {
  const handleTabClick = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Ignore if not running on native device
    }
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] border-t border-border/60 glass safe-bottom z-40">
      <div className="grid grid-cols-5">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            onClick={handleTabClick}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-all duration-200 min-h-[56px] relative ${
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
                      ? "bg-primary/12 shadow-glow scale-110"
                      : "scale-100"
                  }`}
                >
                  <tab.icon
                    className={`transition-all duration-200 ${
                      isActive ? "w-5 h-5 stroke-[2.5]" : "w-5 h-5 stroke-[1.8]"
                    }`}
                  />
                </div>
                <span className={`transition-all duration-200 ${isActive ? "font-bold" : "font-medium"}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute -top-[1px] w-10 h-0.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
