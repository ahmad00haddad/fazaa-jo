import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useRealtimeFazaa } from "@/hooks/useRealtimeFazaa";
import BottomTabBar from "./BottomTabBar";

interface Props {
  children: ReactNode;
}

export default function MobileLayout({ children }: Props) {
  useRealtimeFazaa();

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md bg-card shadow-xl min-h-screen relative flex flex-col overflow-hidden">
        <main className="flex-1 pb-24 no-scrollbar">{children}</main>
        <BottomTabBar />
      </div>
    </div>
  );
}
