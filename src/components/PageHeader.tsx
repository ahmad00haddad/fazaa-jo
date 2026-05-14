import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface Props { title: string; subtitle?: string; children?: ReactNode; back?: boolean }

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
      </div>
    </header>
  );
}
