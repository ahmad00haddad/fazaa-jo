import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function callAI(opts: { system?: string; prompt: string; model?: string }): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai", { body: opts });
  if (error) {
    const msg = error.message || "حدث خطأ";
    if (msg.includes("429")) toast.error("تم تجاوز الحد المسموح. حاول بعد قليل.");
    else if (msg.includes("402")) toast.error("نفد الرصيد المجاني. يرجى الإضافة لاحقاً.");
    else toast.error("حدث خطأ في الخدمة. حاول مرة أخرى.");
    throw new Error(msg);
  }
  if ((data as any)?.error) {
    toast.error((data as any).error);
    throw new Error((data as any).error);
  }
  return (data as any)?.text ?? "";
}

export async function streamChat(opts: {
  messages: { role: "user" | "assistant"; content: string }[];
  system?: string;
  onDelta: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages: opts.messages, system: opts.system }),
    signal: opts.signal,
  });

  if (!resp.ok || !resp.body) {
    if (resp.status === 429) { toast.error("تم تجاوز الحد. حاول بعد قليل."); throw new Error("rate limit"); }
    if (resp.status === 402) { toast.error("نفد الرصيد المجاني."); throw new Error("payment required"); }
    toast.error("خطأ في خدمة المحادثة.");
    throw new Error("stream failed");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;
  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line || line.startsWith(":")) continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) opts.onDelta(content);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
}
