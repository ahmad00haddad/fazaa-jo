import { useState, useRef, useEffect } from "react";
import { streamChat } from "@/lib/ai";
import PageHeader from "@/components/PageHeader";
import { Send, Loader2, Sparkles } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next = [...messages, { role: "user", content: text } as Msg];
    setMessages(next);
    setLoading(true);

    let acc = "";
    try {
      await streamChat({
        messages: next,
        onDelta: (chunk) => {
          acc += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m));
            }
            return [...prev, { role: "assistant", content: acc }];
          });
        },
      });
    } catch {
      // toasted
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "اعطني فكرة لمشروع صغير",
    "اشرح لي البلوك تشين ببساطة",
    "كيف أحسن نومي؟",
    "اقترح وجبة عشاء صحية",
  ];

  return (
    <div className="flex flex-col h-screen">
      <PageHeader title="المساعد الذكي" subtitle="اسأل عن أي شيء" />

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
        {messages.length === 0 && (
          <div className="text-center pt-8">
            <div className="w-16 h-16 mx-auto rounded-3xl gradient-hero flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display font-bold text-lg">كيف أساعدك اليوم؟</h2>
            <p className="text-sm text-muted-foreground mt-1">اكتب سؤالك أو جرّب الاقتراحات</p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="bg-card rounded-2xl p-3 text-xs text-right shadow-card hover:shadow-elevated active:scale-95 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                m.role === "user"
                  ? "gradient-hero text-primary-foreground rounded-bl-md"
                  : "bg-card shadow-card rounded-br-md"
              }`}
            >
              {m.content || <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="border-t border-border bg-card p-3 safe-bottom">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="اكتب رسالتك..."
            rows={1}
            className="flex-1 bg-secondary rounded-2xl px-4 py-2.5 text-sm outline-none resize-none max-h-32"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-full gradient-hero text-primary-foreground flex items-center justify-center disabled:opacity-50 active:scale-90 transition-transform"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 -rotate-180" />}
          </button>
        </div>
      </form>
    </div>
  );
}
