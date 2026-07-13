import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useRealtimeFazaa } from "@/hooks/useRealtimeFazaa";
import BottomTabBar from "./BottomTabBar";

interface Props {
  children: ReactNode;
}

export default function MobileLayout({ children }: Props) {
  useRealtimeFazaa();
  const location = useLocation();
  const hideNav = location.pathname === "/chat";

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="relative min-h-screen w-full max-w-[480px] bg-background flex flex-col shadow-card">
        <main className={`flex-1 ${hideNav ? "pb-0" : "pb-24"} no-scrollbar`}>{children}</main>
        {!hideNav && <BottomTabBar />}
      </div>
    </div>
  );
}
