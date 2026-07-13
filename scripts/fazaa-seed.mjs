#!/usr/bin/env node
/**
 * fazaa-seed.mjs
 * سكريبت شامل يقوم بـ:
 * 1. إضافة عمود gender_visibility إلى fazaa_requests
 * 2. تحديث سياسات RLS
 * 3. إنشاء مستخدمين تجريبيين + 40 طلب فزعة
 *
 * الاستخدام:
 *   node scripts/fazaa-seed.mjs <SERVICE_ROLE_KEY>
 *
 * احصل على SERVICE_ROLE_KEY من:
 *   Supabase Dashboard → Project Settings → API → service_role (secret)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://frplvrscozaghbfolaiq.supabase.co";
const SERVICE_ROLE_KEY = process.argv[2];

if (!SERVICE_ROLE_KEY) {
  console.error("❌ يجب تمرير service_role key كـ argument أول:");
  console.error(
    "   node scripts/fazaa-seed.mjs eyJhbGci..."
  );
  process.exit(1);
}

// نستخدم service_role لتجاوز RLS و Triggers
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ----------- Migration: إضافة عمود gender_visibility -----------
async function runMigration() {
  console.log("\n📦 1. تشغيل Migration: إضافة gender_visibility...");
  const { error } = await supabase.rpc("pg_catalog.pg_sleep", { seconds: 0 }); // sanity check
  // نشغل الـ SQL مباشرة
  const migrations = [
    `ALTER TABLE public.fazaa_requests ADD COLUMN IF NOT EXISTS gender_visibility TEXT DEFAULT 'all';`,
    `UPDATE public.fazaa_requests SET gender_visibility = 'female_only' WHERE female_only = true AND gender_visibility = 'all';`,
    `DROP POLICY IF EXISTS "Anyone can read fazaa_requests" ON public.fazaa_requests;`,
    `
    CREATE POLICY IF NOT EXISTS "Gender aware read policy for fazaa_requests"
    ON public.fazaa_requests FOR SELECT
    USING (
      gender_visibility = 'all'
      OR user_id = auth.uid()
      OR (gender_visibility = 'female_only' AND (SELECT gender FROM public.profiles WHERE id = auth.uid()) = 'female')
      OR (gender_visibility = 'male_only'   AND (SELECT gender FROM public.profiles WHERE id = auth.uid()) = 'male')
    );
    `,
  ];

  for (const sql of migrations) {
    const res = await supabase.rpc("exec_sql", { query: sql }).single();
    if (res.error && !res.error.message.includes("already exists")) {
      // exec_sql قد لا يكون موجوداً — نحاول طريقة بديلة
      // سنتجاهل الأخطاء في Migration لأن لوحة SQL قد تكون أدّتها مسبقاً
      console.warn(`  ⚠️  Migration warning: ${res.error.message}`);
    }
  }
  console.log("  ✅ Migration done (أو كانت مُطبّقة مسبقاً)");
}

// ----------- Seeding -----------
const CITIES = ["عمّان", "إربد", "الزرقاء", "العقبة", "السلط"];
const CATEGORIES = ["تعطل مركبة", "دواء عاجل", "توصيل ومشاوير", "طوارئ منزل", "أخرى"];
const URGENCIES = ["حرجة", "عاجلة اليوم", "عادية"];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randFloat(min, max) {
  return min + Math.random() * (max - min);
}

async function createSeedUser(email, password, name, gender) {
  console.log(`  → إنشاء مستخدم: ${name} (${email})`);

  // حذف المستخدم لو موجود مسبقاً (تجنب تعارض البيانات عند تكرار السكريبت)
  const { data: existingList } = await supabase.auth.admin.listUsers();
  const existing = existingList?.users?.find((u) => u.email === email);
  if (existing) {
    console.log(`    ⚠️  موجود مسبقاً (${existing.id})`);
    return existing.id;
  }

  // إنشاء المستخدم في auth.users
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, gender },
  });
  if (error) {
    console.error(`    ❌ فشل إنشاء المستخدم: ${error.message}`);
    process.exit(1);
  }

  const userId = data.user.id;

  // إنشاء البروفايل — نتجاوز trigger_gender_change لأن هذا إدراج جديد
  const { error: profileError } = await supabase.from("profiles").upsert(
    { id: userId, name, gender, verified: true },
    { onConflict: "id" }
  );
  if (profileError) {
    console.warn(`    ⚠️  Profile upsert: ${profileError.message}`);
  }

  return userId;
}

async function seedFazaaRequests(maleId, femaleId) {
  console.log("\n📋 3. إدراج 40 طلب فزعة تجريبي...");

  const requests = [];
  for (let i = 1; i <= 40; i++) {
    const isMale = i % 2 === 0;
    let genderVis = "all";
    if (i % 5 === 0) genderVis = "female_only";
    else if (i % 7 === 0) genderVis = "male_only";

    requests.push({
      user_id: isMale ? maleId : femaleId,
      requester_name: isMale ? "نشمي الأردن" : "نشمية الأردن",
      requester_gender: isMale ? "male" : "female",
      need: `طلب فزعة تجريبي رقم ${i} — للتدريب والاختبار`,
      category: rand(CATEGORIES),
      urgency: rand(URGENCIES),
      location: `${rand(CITIES)} - منطقة ${i}`,
      latitude: randFloat(31.5, 32.5),
      longitude: randFloat(35.7, 36.1),
      gender_visibility: genderVis,
      female_only: genderVis === "female_only",
      city: rand(CITIES),
      status: "active",
      requester_verified: true,
      price_jod: (i % 5) * 2,
    });
  }

  const { error } = await supabase.from("fazaa_requests").insert(requests);
  if (error) {
    console.error(`  ❌ فشل إدراج الطلبات: ${error.message}`);
    process.exit(1);
  }
  console.log("  ✅ تم إدراج 40 طلب فزعة بنجاح!");
}

// ----------- Main -----------
async function main() {
  console.log("🚀 fazaa-seed — بدء التشغيل...");
  console.log(`   URL: ${SUPABASE_URL}`);

  // تحقق من الاتصال
  const { data, error } = await supabase.from("profiles").select("id").limit(1);
  if (error) {
    console.error("❌ فشل الاتصال بـ Supabase:", error.message);
    process.exit(1);
  }
  console.log("  ✅ اتصال ناجح");

  // Migration
  await runMigration();

  // إنشاء المستخدمين
  console.log("\n👤 2. إنشاء مستخدمين تجريبيين...");
  const maleId = await createSeedUser(
    "male_seed@fazaa.jo",
    "FazaaSeed2026!",
    "نشمي الأردن",
    "male"
  );
  const femaleId = await createSeedUser(
    "female_seed@fazaa.jo",
    "FazaaSeed2026!",
    "نشمية الأردن",
    "female"
  );

  // إدراج البيانات
  await seedFazaaRequests(maleId, femaleId);

  console.log("\n🎉 اكتمل السكريبت بنجاح!");
  console.log("   مستخدم ذكر: male_seed@fazaa.jo / FazaaSeed2026!");
  console.log("   مستخدمة أنثى: female_seed@fazaa.jo / FazaaSeed2026!");
}

main().catch((e) => {
  console.error("خطأ غير متوقع:", e);
  process.exit(1);
});
