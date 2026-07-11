import { useEffect, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallPWAButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua);
    setIsIOS(ios);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore
      window.navigator.standalone === true;
    setInstalled(standalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      toast.success("تم تثبيت التطبيق ✅");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    if (isIOS) {
      setShowIOSHelp((v) => !v);
      return;
    }
    toast.info("افتح قائمة المتصفح واختر 'إضافة إلى الشاشة الرئيسية'");
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        className="w-full rounded-2xl bg-primary/10 text-primary py-3.5 font-semibold flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        تثبيت فزعة على جهازك
      </button>
      {isIOS && showIOSHelp && (
        <div className="rounded-2xl bg-secondary p-3 text-xs leading-6 text-muted-foreground">
          <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
            <Share2 className="w-4 h-4" /> على آيفون
          </div>
          افتح فزعة داخل Safari، اضغط زر المشاركة <Share2 className="inline w-3 h-3" />، ثم اختر "إضافة إلى الشاشة الرئيسية".
        </div>
      )}
    </div>
  );
}
