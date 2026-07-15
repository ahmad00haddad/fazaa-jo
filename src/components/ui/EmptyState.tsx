import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-secondary/50 p-10 text-center flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
        <Icon className="w-8 h-8 text-muted-foreground opacity-60" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-display font-bold text-lg text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
          {description}
        </p>
      </div>
      {action && <div className="mt-2 w-full">{action}</div>}
    </div>
  );
}
