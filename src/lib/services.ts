import { LucideIcon, MessageCircle, Languages, FileText, ChefHat, BookOpen, Briefcase, Mail, Sparkles, Scale, SpellCheck, Lightbulb, Calculator, Heart, MapPin, Dumbbell, PiggyBank, Baby, Stethoscope, Code2 } from "lucide-react";

export interface ServiceField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  rows?: number;
}

export interface ServiceConfig {
  slug: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  color: string; // tailwind gradient class pair
  category: string;
  system: string;
  fields: ServiceField[];
  buildPrompt: (values: Record<string, string>) => string;
  outputLabel?: string;
}

export const SERVICES: ServiceConfig[] = [
  {
    slug: "translator",
    title: "مترجم فوري",
    desc: "ترجمة بين العربي والإنجليزي وأي لغة",
    icon: Languages,
    color: "from-blue-500 to-cyan-500",
    category: "إنتاجية",
    system: "أنت مترجم محترف. ترجم النص المعطى بدقة مع الحفاظ على المعنى والأسلوب. أعطِ الترجمة فقط دون شرح.",
    fields: [
      { name: "from", label: "من لغة", type: "select", required: true, options: [
        { value: "auto", label: "كشف تلقائي" },
        { value: "العربية", label: "العربية" },
        { value: "الإنجليزية", label: "الإنجليزية" },
        { value: "الفرنسية", label: "الفرنسية" },
        { value: "الإسبانية", label: "الإسبانية" },
        { value: "التركية", label: "التركية" },
      ]},
      { name: "to", label: "إلى لغة", type: "select", required: true, options: [
        { value: "العربية", label: "العربية" },
        { value: "الإنجليزية", label: "الإنجليزية" },
        { value: "الفرنسية", label: "الفرنسية" },
        { value: "الإسبانية", label: "الإسبانية" },
        { value: "التركية", label: "التركية" },
      ]},
      { name: "text", label: "النص", type: "textarea", placeholder: "اكتب النص المراد ترجمته...", required: true, rows: 5 },
    ],
    buildPrompt: (v) => `ترجم النص التالي من ${v.from === "auto" ? "اللغة المكتشفة تلقائياً" : v.from} إلى ${v.to}:\n\n${v.text}`,
    outputLabel: "الترجمة",
  },
  {
    slug: "summarizer",
    title: "ملخص نصوص",
    desc: "تلخيص أي نص أو مقال طويل",
    icon: FileText,
    color: "from-purple-500 to-pink-500",
    category: "إنتاجية",
    system: "أنت خبير في تلخيص النصوص. لخّص النص بشكل واضح ومنظم باللغة العربية مع الحفاظ على النقاط الرئيسية.",
    fields: [
      { name: "length", label: "طول الملخص", type: "select", options: [
        { value: "قصير جداً (3 جمل)", label: "قصير جداً (3 جمل)" },
        { value: "متوسط (فقرة واحدة)", label: "متوسط (فقرة واحدة)" },
        { value: "مفصل مع نقاط", label: "مفصل مع نقاط" },
      ], required: true },
      { name: "text", label: "النص", type: "textarea", placeholder: "ألصق النص هنا...", required: true, rows: 8 },
    ],
    buildPrompt: (v) => `لخّص النص التالي بشكل ${v.length}:\n\n${v.text}`,
    outputLabel: "الملخص",
  },
  {
    slug: "message-writer",
    title: "كاتب رسائل",
    desc: "اكتب إيميل أو رسالة احترافية",
    icon: Mail,
    color: "from-emerald-500 to-teal-500",
    category: "إنتاجية",
    system: "أنت كاتب محترف للرسائل والإيميلات. اكتب رسائل واضحة ومهذبة ومناسبة للسياق.",
    fields: [
      { name: "type", label: "نوع الرسالة", type: "select", required: true, options: [
        { value: "إيميل عمل رسمي", label: "إيميل عمل رسمي" },
        { value: "اعتذار", label: "اعتذار" },
        { value: "طلب وظيفة", label: "طلب وظيفة" },
        { value: "شكوى", label: "شكوى" },
        { value: "تهنئة", label: "تهنئة" },
        { value: "دعوة", label: "دعوة" },
        { value: "رسالة شخصية", label: "رسالة شخصية" },
      ]},
      { name: "lang", label: "اللغة", type: "select", required: true, options: [
        { value: "العربية", label: "العربية" }, { value: "الإنجليزية", label: "الإنجليزية" },
      ]},
      { name: "to", label: "المُرسل إليه", type: "text", placeholder: "مثال: مديري في العمل" },
      { name: "topic", label: "الموضوع/المحتوى", type: "textarea", placeholder: "اشرح ما تريد قوله بإيجاز...", required: true, rows: 4 },
    ],
    buildPrompt: (v) => `اكتب ${v.type} باللغة ${v.lang}${v.to ? ` موجهة إلى: ${v.to}` : ""}.\nالمحتوى المطلوب: ${v.topic}`,
    outputLabel: "الرسالة",
  },
  {
    slug: "cv-writer",
    title: "كاتب سيرة ذاتية",
    desc: "أنشئ سيرة ذاتية احترافية",
    icon: Briefcase,
    color: "from-indigo-500 to-purple-500",
    category: "وظائف",
    system: "أنت خبير في كتابة السير الذاتية. اكتب سيرة ذاتية احترافية ومنظمة بصيغة جذابة لأصحاب العمل.",
    fields: [
      { name: "name", label: "الاسم الكامل", type: "text", required: true },
      { name: "job", label: "الوظيفة المستهدفة", type: "text", required: true, placeholder: "مثال: مهندس برمجيات" },
      { name: "exp", label: "الخبرات (باختصار)", type: "textarea", required: true, rows: 4, placeholder: "اذكر آخر وظائفك ومهامك..." },
      { name: "skills", label: "المهارات", type: "textarea", rows: 3, placeholder: "مثال: JavaScript, إدارة فرق..." },
      { name: "edu", label: "التعليم", type: "text", placeholder: "مثال: بكالوريوس هندسة - الجامعة الأردنية" },
      { name: "lang", label: "اللغة", type: "select", required: true, options: [
        { value: "العربية", label: "العربية" }, { value: "الإنجليزية", label: "الإنجليزية" },
      ]},
    ],
    buildPrompt: (v) => `اكتب سيرة ذاتية احترافية باللغة ${v.lang} للشخص التالي:\nالاسم: ${v.name}\nالوظيفة المستهدفة: ${v.job}\nالخبرات: ${v.exp}\nالمهارات: ${v.skills || "—"}\nالتعليم: ${v.edu || "—"}\n\nنظّمها بأقسام: ملخص شخصي، الخبرات، المهارات، التعليم.`,
    outputLabel: "السيرة الذاتية",
  },
  {
    slug: "cover-letter",
    title: "رسالة تقديم",
    desc: "Cover letter لطلب وظيفة",
    icon: Briefcase,
    color: "from-violet-500 to-fuchsia-500",
    category: "وظائف",
    system: "أنت خبير في كتابة رسائل التقديم للوظائف. اكتب رسالة مقنعة ومخصصة للوظيفة.",
    fields: [
      { name: "job", label: "الوظيفة", type: "text", required: true },
      { name: "company", label: "الشركة", type: "text", required: true },
      { name: "exp", label: "خبراتك المرتبطة", type: "textarea", required: true, rows: 4 },
      { name: "lang", label: "اللغة", type: "select", required: true, options: [
        { value: "العربية", label: "العربية" }, { value: "الإنجليزية", label: "الإنجليزية" },
      ]},
    ],
    buildPrompt: (v) => `اكتب Cover Letter باللغة ${v.lang} لوظيفة ${v.job} في شركة ${v.company}. خبراتي: ${v.exp}`,
    outputLabel: "رسالة التقديم",
  },
  {
    slug: "recipes",
    title: "وصفات طبخ",
    desc: "وصفات بناءً على المكونات الموجودة",
    icon: ChefHat,
    color: "from-orange-500 to-red-500",
    category: "حياتي",
    system: "أنت شيف عربي خبير. اقترح وصفات شعبية وعالمية مناسبة. اعرض المقادير وطريقة التحضير بشكل واضح ومرتب.",
    fields: [
      { name: "ingredients", label: "المكونات المتوفرة", type: "textarea", required: true, rows: 3, placeholder: "مثال: بندورة، بيض، خبز..." },
      { name: "people", label: "عدد الأشخاص", type: "text", placeholder: "4" },
      { name: "type", label: "نوع الوجبة", type: "select", options: [
        { value: "أي وجبة", label: "أي وجبة" },
        { value: "فطور", label: "فطور" },
        { value: "غداء", label: "غداء" },
        { value: "عشاء", label: "عشاء" },
        { value: "حلويات", label: "حلويات" },
      ]},
    ],
    buildPrompt: (v) => `اقترح وصفة ${v.type || "أي وجبة"} لـ${v.people || "شخصين"} باستخدام: ${v.ingredients}. اعرض المقادير وخطوات التحضير ووقت الطهي.`,
    outputLabel: "الوصفة",
  },
  {
    slug: "homework",
    title: "مساعد دراسي",
    desc: "اشرح أي مفهوم أو حل مسألة",
    icon: BookOpen,
    color: "from-amber-500 to-orange-500",
    category: "تعليم",
    system: "أنت معلم خصوصي صبور وذكي. اشرح المفاهيم بطريقة بسيطة مع أمثلة وحل خطوة بخطوة.",
    fields: [
      { name: "subject", label: "المادة", type: "select", required: true, options: [
        { value: "رياضيات", label: "رياضيات" },
        { value: "فيزياء", label: "فيزياء" },
        { value: "كيمياء", label: "كيمياء" },
        { value: "أحياء", label: "أحياء" },
        { value: "لغة عربية", label: "لغة عربية" },
        { value: "لغة إنجليزية", label: "لغة إنجليزية" },
        { value: "تاريخ", label: "تاريخ" },
        { value: "جغرافيا", label: "جغرافيا" },
        { value: "حاسوب", label: "حاسوب" },
        { value: "أخرى", label: "أخرى" },
      ]},
      { name: "level", label: "المرحلة", type: "select", required: true, options: [
        { value: "ابتدائي", label: "ابتدائي" },
        { value: "إعدادي", label: "إعدادي/متوسط" },
        { value: "ثانوي", label: "ثانوي/توجيهي" },
        { value: "جامعي", label: "جامعي" },
      ]},
      { name: "question", label: "السؤال أو المفهوم", type: "textarea", required: true, rows: 5, placeholder: "اكتب السؤال أو ألصق صورته..." },
    ],
    buildPrompt: (v) => `أنا طالب ${v.level} وأحتاج مساعدة في ${v.subject}.\nالسؤال: ${v.question}\nاشرح لي الحل خطوة بخطوة بطريقة مبسطة.`,
    outputLabel: "الشرح",
  },
  {
    slug: "essay",
    title: "كاتب مقالات",
    desc: "اكتب مقال أو موضوع تعبير",
    icon: BookOpen,
    color: "from-rose-500 to-pink-500",
    category: "تعليم",
    system: "أنت كاتب محترف. اكتب مقالات منظمة بمقدمة وعرض وخاتمة بأسلوب فصيح ومناسب.",
    fields: [
      { name: "topic", label: "الموضوع", type: "text", required: true, placeholder: "مثال: أهمية القراءة" },
      { name: "level", label: "المستوى", type: "select", options: [
        { value: "مدرسي", label: "مدرسي" }, { value: "جامعي", label: "جامعي" }, { value: "احترافي", label: "احترافي" },
      ]},
      { name: "len", label: "الطول", type: "select", options: [
        { value: "200 كلمة", label: "قصير (200 كلمة)" },
        { value: "500 كلمة", label: "متوسط (500 كلمة)" },
        { value: "1000 كلمة", label: "طويل (1000 كلمة)" },
      ]},
    ],
    buildPrompt: (v) => `اكتب مقالاً ${v.level || "احترافي"} بطول ${v.len || "500 كلمة"} عن: ${v.topic}. نظّمه بمقدمة وعرض وخاتمة.`,
    outputLabel: "المقال",
  },
  {
    slug: "spell-check",
    title: "تصحيح إملائي",
    desc: "تصحيح الأخطاء النحوية والإملائية",
    icon: SpellCheck,
    color: "from-teal-500 to-emerald-500",
    category: "إنتاجية",
    system: "أنت مدقق لغوي خبير في العربية. صحّح الأخطاء الإملائية والنحوية والأسلوبية. اعرض النص المصحح ثم اذكر التعديلات الرئيسية.",
    fields: [
      { name: "text", label: "النص", type: "textarea", required: true, rows: 6 },
    ],
    buildPrompt: (v) => `صحّح الأخطاء الإملائية والنحوية في النص التالي واعرض النص المصحح ثم نقطة سريعة عن أهم التعديلات:\n\n${v.text}`,
    outputLabel: "النص المصحح",
  },
  {
    slug: "ideas",
    title: "مولّد أفكار",
    desc: "أفكار لمشاريع، محتوى، هدايا، وغيرها",
    icon: Lightbulb,
    color: "from-yellow-500 to-amber-500",
    category: "إبداع",
    system: "أنت مستشار إبداعي. أعطِ أفكاراً عملية ومتنوعة وقابلة للتطبيق.",
    fields: [
      { name: "topic", label: "اعطني أفكار عن", type: "text", required: true, placeholder: "مثال: مشروع صغير برأس مال 500 دينار" },
      { name: "count", label: "عدد الأفكار", type: "select", options: [
        { value: "5", label: "5 أفكار" }, { value: "10", label: "10 أفكار" }, { value: "15", label: "15 فكرة" },
      ]},
    ],
    buildPrompt: (v) => `اقترح ${v.count || "5"} أفكار ${v.topic}. اجعلها عملية ومتنوعة مع شرح موجز لكل فكرة.`,
    outputLabel: "الأفكار",
  },
  {
    slug: "legal",
    title: "استشارة قانونية",
    desc: "أسئلة قانونية بسياق أردني",
    icon: Scale,
    color: "from-slate-500 to-gray-700",
    category: "حياتي",
    system: "أنت مستشار قانوني عام مختص بالقوانين الأردنية والعربية. أجب بشكل عملي ومبسط وأكد دائماً أن النصيحة عامة وأن المحامي المختص هو المرجع النهائي.",
    fields: [
      { name: "country", label: "البلد", type: "select", options: [
        { value: "الأردن", label: "الأردن" }, { value: "السعودية", label: "السعودية" },
        { value: "الإمارات", label: "الإمارات" }, { value: "مصر", label: "مصر" },
        { value: "عام", label: "عام" },
      ], required: true },
      { name: "q", label: "السؤال", type: "textarea", required: true, rows: 5 },
    ],
    buildPrompt: (v) => `سؤال قانوني في سياق ${v.country}:\n${v.q}\n\nأجب بشكل واضح ومبسط واذكر التحذير في الأخير.`,
    outputLabel: "الإجابة",
  },
  {
    slug: "health",
    title: "معلومات صحية",
    desc: "معلومات عامة عن أعراض ونصائح",
    icon: Stethoscope,
    color: "from-red-500 to-rose-500",
    category: "حياتي",
    system: "أنت مساعد صحي. تعطي معلومات عامة فقط ولست بديلاً عن الطبيب. حذّر دائماً من ضرورة استشارة الطبيب للحالات الجدية.",
    fields: [
      { name: "type", label: "النوع", type: "select", required: true, options: [
        { value: "أعراض", label: "أعراض أعاني منها" },
        { value: "دواء", label: "معلومات عن دواء" },
        { value: "نصيحة", label: "نصيحة صحية عامة" },
      ]},
      { name: "q", label: "التفاصيل", type: "textarea", required: true, rows: 4 },
    ],
    buildPrompt: (v) => `${v.type}: ${v.q}\n\nأعطني معلومات عامة وحذرني من ضرورة مراجعة طبيب مختص عند الحاجة.`,
    outputLabel: "المعلومة",
  },
  {
    slug: "fitness",
    title: "خطة رياضية",
    desc: "خطة تمارين مخصصة لك",
    icon: Dumbbell,
    color: "from-lime-500 to-green-500",
    category: "حياتي",
    system: "أنت مدرب لياقة. اكتب خطط تمارين عملية وآمنة مع مراعاة المستوى والهدف.",
    fields: [
      { name: "goal", label: "الهدف", type: "select", required: true, options: [
        { value: "تخسيس", label: "خسارة وزن" },
        { value: "بناء عضلات", label: "بناء عضلات" },
        { value: "لياقة عامة", label: "لياقة عامة" },
        { value: "مرونة", label: "مرونة وتمدد" },
      ]},
      { name: "level", label: "المستوى", type: "select", required: true, options: [
        { value: "مبتدئ", label: "مبتدئ" }, { value: "متوسط", label: "متوسط" }, { value: "متقدم", label: "متقدم" },
      ]},
      { name: "place", label: "المكان", type: "select", required: true, options: [
        { value: "البيت بدون أدوات", label: "البيت بدون أدوات" },
        { value: "البيت مع دمبل", label: "البيت مع دمبل" },
        { value: "نادي رياضي", label: "نادي رياضي" },
      ]},
      { name: "days", label: "أيام في الأسبوع", type: "select", options: [
        { value: "3", label: "3 أيام" }, { value: "4", label: "4 أيام" }, { value: "5", label: "5 أيام" }, { value: "6", label: "6 أيام" },
      ], required: true },
    ],
    buildPrompt: (v) => `صمم لي خطة تمارين ${v.goal} لمستوى ${v.level} في ${v.place} لمدة ${v.days} أيام في الأسبوع. نظمها يوم بيوم بتمارين واضحة وعدد جولات وتكرارات.`,
    outputLabel: "الخطة",
  },
  {
    slug: "diet",
    title: "نظام غذائي",
    desc: "خطة غذائية يومية بمكونات محلية",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    category: "حياتي",
    system: "أنت أخصائي تغذية. صمم خطط غذائية متوازنة بمكونات متوفرة في الأردن والعالم العربي.",
    fields: [
      { name: "goal", label: "الهدف", type: "select", required: true, options: [
        { value: "تخسيس", label: "خسارة وزن" }, { value: "زيادة وزن", label: "زيادة وزن" }, { value: "صحي متوازن", label: "غذاء صحي متوازن" },
      ]},
      { name: "weight", label: "الوزن (كجم)", type: "text" },
      { name: "height", label: "الطول (سم)", type: "text" },
      { name: "age", label: "العمر", type: "text" },
      { name: "allergies", label: "حساسية أو ممنوعات", type: "text", placeholder: "مثال: مكسرات، لاكتوز" },
    ],
    buildPrompt: (v) => `صمم خطة غذائية ${v.goal} ليوم كامل لشخص: العمر ${v.age || "—"}، الطول ${v.height || "—"}، الوزن ${v.weight || "—"}، يتجنب: ${v.allergies || "لا شيء"}. استخدم مكونات شرق أوسطية متوفرة، 3 وجبات + سناك، مع السعرات لكل وجبة.`,
    outputLabel: "الخطة الغذائية",
  },
  {
    slug: "budget",
    title: "نصائح مالية",
    desc: "ميزانية شهرية أو نصائح ادخار",
    icon: PiggyBank,
    color: "from-green-600 to-emerald-600",
    category: "حياتي",
    system: "أنت مستشار مالي شخصي. أعطِ نصائح عملية تناسب الراتب والظروف في الأردن والمنطقة العربية.",
    fields: [
      { name: "income", label: "الدخل الشهري (دينار/ريال/جنيه)", type: "text", required: true, placeholder: "500" },
      { name: "currency", label: "العملة", type: "select", options: [
        { value: "دينار أردني", label: "دينار أردني" }, { value: "ريال سعودي", label: "ريال سعودي" },
        { value: "درهم إماراتي", label: "درهم إماراتي" }, { value: "جنيه مصري", label: "جنيه مصري" },
      ], required: true },
      { name: "goal", label: "الهدف", type: "textarea", rows: 3, placeholder: "مثال: ادخار لشراء سيارة، تسديد ديون..." },
    ],
    buildPrompt: (v) => `راتبي ${v.income} ${v.currency} شهرياً. هدفي: ${v.goal || "ميزانية شهرية متوازنة"}. صمم لي توزيع الميزانية بنسب مئوية وقيم محددة، ونصائح ادخار عملية.`,
    outputLabel: "الخطة",
  },
  {
    slug: "kids",
    title: "نصائح للأهل",
    desc: "تربية الأطفال وأنشطتهم",
    icon: Baby,
    color: "from-cyan-500 to-blue-500",
    category: "حياتي",
    system: "أنت مستشار تربوي. أعطِ نصائح عملية ومحبة للوالدين وأنشطة ممتعة للأطفال.",
    fields: [
      { name: "age", label: "عمر الطفل", type: "text", required: true, placeholder: "5 سنوات" },
      { name: "q", label: "السؤال", type: "textarea", required: true, rows: 4, placeholder: "مثال: كيف أعالج عناده؟" },
    ],
    buildPrompt: (v) => `طفلي عمره ${v.age}. ${v.q}\nأعطني نصائح عملية ومحبة.`,
    outputLabel: "النصائح",
  },
  {
    slug: "trip",
    title: "خطة سفر",
    desc: "خطة رحلة لأي وجهة",
    icon: MapPin,
    color: "from-sky-500 to-blue-600",
    category: "حياتي",
    system: "أنت خبير سفر. اقترح خطط سفر عملية مع أماكن وأكلات وأسعار تقريبية ونصائح محلية.",
    fields: [
      { name: "dest", label: "الوجهة", type: "text", required: true, placeholder: "مثال: تركيا، البتراء، دبي" },
      { name: "days", label: "عدد الأيام", type: "text", required: true, placeholder: "5" },
      { name: "people", label: "عدد الأشخاص", type: "text", placeholder: "2" },
      { name: "budget", label: "الميزانية التقريبية", type: "text", placeholder: "1000 دينار" },
      { name: "interest", label: "الاهتمامات", type: "text", placeholder: "تاريخ، طبيعة، تسوق..." },
    ],
    buildPrompt: (v) => `صمم خطة سفر إلى ${v.dest} لمدة ${v.days} أيام لـ${v.people || "شخصين"} بميزانية ${v.budget || "متوسطة"}. الاهتمامات: ${v.interest || "متنوعة"}. أعطِ خطة يوم بيوم مع أماكن إقامة ومطاعم ونصائح.`,
    outputLabel: "خطة السفر",
  },
  {
    slug: "code",
    title: "مساعد برمجة",
    desc: "اشرح أو اكتب كود",
    icon: Code2,
    color: "from-zinc-700 to-zinc-900",
    category: "تعليم",
    system: "أنت مبرمج خبير. اكتب كوداً نظيفاً واشرحه بالعربية بشكل واضح.",
    fields: [
      { name: "lang", label: "لغة البرمجة", type: "select", required: true, options: [
        { value: "JavaScript", label: "JavaScript" }, { value: "Python", label: "Python" },
        { value: "TypeScript", label: "TypeScript" }, { value: "Java", label: "Java" },
        { value: "C++", label: "C++" }, { value: "PHP", label: "PHP" }, { value: "SQL", label: "SQL" },
      ]},
      { name: "task", label: "المطلوب", type: "textarea", required: true, rows: 5, placeholder: "اشرح ما تريد..." },
    ],
    buildPrompt: (v) => `بلغة ${v.lang}: ${v.task}\nاكتب الكود مع شرح بالعربية.`,
    outputLabel: "الحل",
  },
  {
    slug: "names",
    title: "اقتراح أسماء",
    desc: "أسماء مواليد، شركات، منتجات",
    icon: Sparkles,
    color: "from-fuchsia-500 to-purple-500",
    category: "إبداع",
    system: "أنت خبير في تسمية المواليد والشركات والمنتجات. اقترح أسماء ذات معنى جميل.",
    fields: [
      { name: "type", label: "النوع", type: "select", required: true, options: [
        { value: "اسم مولود ذكر", label: "اسم مولود ذكر" },
        { value: "اسم مولودة أنثى", label: "اسم مولودة أنثى" },
        { value: "اسم شركة", label: "اسم شركة" },
        { value: "اسم منتج", label: "اسم منتج" },
        { value: "اسم متجر", label: "اسم متجر" },
      ]},
      { name: "context", label: "تفاصيل", type: "textarea", rows: 3, placeholder: "مثال: شركة تقنية، اسم عربي أصيل..." },
    ],
    buildPrompt: (v) => `اقترح 10 أسماء ${v.type}. التفاصيل: ${v.context || "متنوعة"}. لكل اسم اذكر معناه باختصار.`,
    outputLabel: "الأسماء",
  },
  {
    slug: "social",
    title: "كاتب منشورات",
    desc: "منشورات سوشيال ميديا",
    icon: Sparkles,
    color: "from-pink-500 to-rose-500",
    category: "إبداع",
    system: "أنت خبير تسويق رقمي. اكتب منشورات جذابة ومناسبة للمنصة.",
    fields: [
      { name: "platform", label: "المنصة", type: "select", required: true, options: [
        { value: "Instagram", label: "Instagram" }, { value: "Twitter/X", label: "Twitter/X" },
        { value: "Facebook", label: "Facebook" }, { value: "LinkedIn", label: "LinkedIn" }, { value: "TikTok", label: "TikTok" },
      ]},
      { name: "topic", label: "الموضوع", type: "textarea", required: true, rows: 3 },
      { name: "tone", label: "النبرة", type: "select", options: [
        { value: "احترافية", label: "احترافية" }, { value: "ودية", label: "ودية" }, { value: "حماسية", label: "حماسية" }, { value: "كوميدية", label: "كوميدية" },
      ]},
    ],
    buildPrompt: (v) => `اكتب منشور ${v.platform} بنبرة ${v.tone || "ودية"} عن: ${v.topic}. مع هاشتاقات مناسبة.`,
    outputLabel: "المنشور",
  },
];

export const SERVICE_CATEGORIES = ["إنتاجية", "تعليم", "وظائف", "حياتي", "إبداع"];

export function getService(slug: string) {
  return SERVICES.find((s) => s.slug === slug);
}
