import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircleMore, Send, Sparkles } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { streamChat } from "@/lib/ai";

type Message = { role: "user" | "assistant"; content: string };

const suggestions = [
  "اكتب لي طلب فزعة واضح لتعطل سيارة على الطريق",
  "ما أفضل صياغة لطلب دواء عاجل لطفل؟",
  "رتب لي أولويات التصرف عند تعطل السيارة ليلاً",
  "اكتب رسالة قصيرة أرسلها لشخص سيقوم بالمساعدة",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "أنا مساعد فزعة. أساعدك في صياغة طلب المساعدة، ترتيب الخطوات العاجلة، وكتابة رسائل سريعة للتواصل مع من سيقدم المساعدة.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    let assistantText = "";

    try {
      await streamChat({
        system:
          "أنت مساعد متخصص فقط في تطبيق فزعة. ساعد المستخدم العربي والأردني في: صياغة طلب فزعة واضح، تحديد الأولوية، كتابة رسالة واتساب أو اتصال، اقتراح خطوات عاجلة للحالات مثل تعطل السيارة أو الحاجة لدواء أو مشوار عاجل. لا تعرض خدمات عامة خارج هذا النطاق.",
        messages: nextMessages,
        onDelta: (chunk) => {
          assistantText += chunk;
          setMessages((current) => {
            const last = current[current.length - 1];
            if (last?.role === "assistant") {
              return current.map((item, index) =>
                index === current.length - 1 ? { ...item, content: assistantText } : item
              );
            }
            return [...current, { role: "assistant", content: assistantText }];
          });
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <PageHeader title="مساعد فزعة" subtitle="لصياغة الطلب وخطة التصرف السريع" />

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
        <div className="rounded-3xl bg-card shadow-card p-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl gradient-hero text-primary-foreground flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold">استخدمه عندما تكون مستعجلاً</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-6">
                مثال: صياغة طلب واضح، رسالة سريعة للمساعدة، أو خطوات فورية قبل وصول الشخص الذي سيساعدك.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 mt-4">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setInput(suggestion)}
                className="rounded-2xl bg-secondary px-3 py-3 text-right text-sm active:scale-[0.99] transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-7 whitespace-pre-wrap break-words ${
                message.role === "user"
                  ? "gradient-hero text-primary-foreground rounded-bl-lg"
                  : "bg-card shadow-card rounded-br-lg"
              }`}
            >
              {message.content || <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="border-t border-border bg-background p-3 safe-bottom">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="اكتب حالتك أو اطلب صياغة رسالة..."
            rows={1}
            className="flex-1 rounded-2xl bg-secondary px-4 py-3 text-sm outline-none resize-none max-h-32"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-2xl gradient-hero text-primary-foreground flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 -rotate-180" />}
          </button>
        </div>
      </form>
    </div>
  );
}
