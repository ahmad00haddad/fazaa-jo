import { useParams, Navigate } from "react-router-dom";
import { useState } from "react";
import { getService } from "@/lib/services";
import { callAI } from "@/lib/ai";
import PageHeader from "@/components/PageHeader";
import { Loader2, Send, Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function ServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const service = slug ? getService(slug) : undefined;
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");

  if (!service) return <Navigate to="/" replace />;

  const setField = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const valid = service.fields.every((f) => !f.required || (values[f.name] || "").trim().length > 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setOutput("");
    try {
      const text = await callAI({ system: service.system, prompt: service.buildPrompt(values) });
      setOutput(text);
    } catch {
      // error already toasted
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast.success("تم النسخ");
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  const reset = () => { setOutput(""); setValues({}); };

  return (
    <div className="animate-fade-in">
      <PageHeader title={service.title} subtitle={service.desc} />
      <div className="p-4 pb-32">
        <form onSubmit={submit} className="space-y-3">
          {service.fields.map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-display font-semibold mb-1.5">
                {f.label}{f.required && <span className="text-destructive mr-1">*</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  value={values[f.name] || ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  rows={f.rows || 4}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                />
              ) : f.type === "select" ? (
                <select
                  value={values[f.name] || ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="" disabled>اختر...</option>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  value={values[f.name] || ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={!valid || loading}
            className="w-full gradient-hero text-primary-foreground rounded-2xl py-3.5 font-display font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform shadow-card"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> جارٍ المعالجة...</> : <><Send className="w-4 h-4" /> تنفيذ</>}
          </button>
        </form>

        {output && (
          <div className="mt-5 bg-card rounded-2xl p-4 shadow-card animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-sm">{service.outputLabel || "النتيجة"}</h3>
              <div className="flex gap-1">
                <button onClick={copy} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center" aria-label="نسخ">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={reset} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center" aria-label="إعادة">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{output}</div>
          </div>
        )}
      </div>
    </div>
  );
}
