// ─────────────────────────────────────────────────────────────
// tests/setup-accounts.mjs — เตรียมบัญชีทดสอบ 3 บัญชี + ข้อมูลตัวอย่างตาม spec.md หัวข้อ 7
//
// รัน:  npm run setup-test-data   (รันซ้ำได้ ใช้รหัสผ่านเดิม ข้อมูลตัวอย่างถูกเขียนทับ ไม่เพิ่มซ้ำ)
// - สมัครบัญชีผ่าน Firebase Authentication แบบเดียวกับหน้าสมัครสมาชิก (ไม่ใช้สิทธิ์ผู้ดูแล)
// - ทุกการเขียนผ่าน Security Rules จริง — ผู้ดูแลระบบสร้างแจ้งเตือน ครูเวรเขียนบันทึกของตัวเอง
// - รหัสผ่านสุ่มแล้วเก็บใน .env.test (.gitignore กันไว้)
// ⚠️ ชื่อทุกชื่อเป็นชื่อสมมติ · อีเมลเป็น @example.com · ห้ามใส่ข้อมูลจริงของครูหรือนักเรียน
// ─────────────────────────────────────────────────────────────
import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { ACCOUNTS, AUTH_HEADERS, apiKey, loadEnv, signIn, firestore } from "./helpers/firebase-rest.mjs";

const ENV_FILE = new URL("../.env.test", import.meta.url);

// ── 1. รหัสผ่านบัญชีทดสอบ ──
const env = existsSync(ENV_FILE) ? loadEnv() : {};
for (const a of ACCOUNTS) {
  if (!env[a.passwordVar]) env[a.passwordVar] = "Za-" + randomBytes(9).toString("base64url");
}
writeFileSync(ENV_FILE,
  "# รหัสผ่านบัญชีทดสอบ (อีเมลสมมติ @example.com) — ห้าม commit\n" +
  ACCOUNTS.map((a) => `${a.passwordVar}=${env[a.passwordVar]}`).join("\n") + "\n");

// ── 2. สมัครบัญชี + สร้างไฟล์ users/{uid} ──
const sessions = {};
for (const a of ACCOUNTS) {
  const password = env[a.passwordVar];
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({ email: a.email, password, returnSecureToken: true })
  });
  const body = await res.json();
  if (res.ok) {
    sessions[a.key] = { uid: body.localId, idToken: body.idToken };
    console.log(`✔ สมัคร ${a.email}`);
  } else if (body.error?.message === "EMAIL_EXISTS") {
    sessions[a.key] = await signIn(a.email, password);
    console.log(`• มีอยู่แล้ว ${a.email}`);
  } else {
    throw new Error(`สมัคร ${a.email} ไม่สำเร็จ: ${body.error?.message}`);
  }

  const s = sessions[a.key];
  const profile = await firestore(s.idToken, "GET", `users/${s.uid}`);
  if (profile.status === 404) {
    const r = await firestore(s.idToken, "PATCH", `users/${s.uid}?currentDocument.exists=false`,
      { name: a.name, email: a.email, role: a.role });
    if (!r.ok) throw new Error(`สร้างไฟล์ users ของ ${a.email} ไม่สำเร็จ: ${r.status} ${JSON.stringify(r.body)}`);
  }
  console.log(`  บทบาท: ${a.role}`);
}

const admin = sessions.admin;
const ครู = {
  teacher1: { id: sessions.teacher1.uid, name: ACCOUNTS[0].name },
  teacher2: { id: sessions.teacher2.uid, name: ACCOUNTS[1].name }
};

async function เขียน(session, path, fields) {
  const r = await firestore(session.idToken, "PATCH", path, fields);
  if (!r.ok) throw new Error(`เขียน ${path} ไม่สำเร็จ: ${r.status} ${JSON.stringify(r.body)}`);
}

// ── 3. ประเภทเหตุการณ์ (ผู้ดูแลระบบ) ──
const patterns = { pt001: "เข้าพื้นที่ต้องห้าม", pt002: "เล่นเสี่ยงอันตราย", pt003: "รวมกลุ่มผิดปกติ" };
for (const [id, name] of Object.entries(patterns)) await เขียน(admin, `alertPatterns/${id}`, { name });
console.log("✔ ประเภทเหตุการณ์ pt001–pt003");

// ── 4. แจ้งเตือนตัวอย่าง 5 ใบ ตาม DATA-STRUCTURE.md ──
// สร้างเป็น รอรับทราบ ก่อน (กฎบังคับ) แล้วให้ครูเจ้าของกดเปลี่ยนสถานะเองตามลำดับ
const alerts = [
  { id: "al001", ครู: "teacher1", pattern: "pt001", ปลายทาง: "ปิดเคส", createdAt: "2026-09-07 11:48",
    title: "นักเรียนเข้าเขตหลังอาคาร 3", zoneName: "โซน 4 หลังอาคาร 3",
    description: "กล้องจุดที่ 4 เห็นนักเรียนประมาณ 3 คนเดินผ่านแนวกั้นเข้าไปหลังอาคาร 3 ซึ่งเป็นพื้นที่ต้องห้ามช่วงพักกลางวัน อยู่ในพื้นที่นานเกิน 30 วินาที",
    บันทึก: { id: "rs001", message: "ถึงจุดแล้ว พานักเรียนออกจากพื้นที่ และย้ำกติกาเรื่องเขตห้ามเข้าเรียบร้อย", createdAt: "2026-09-07 11:53" } },
  { id: "al002", ครู: "teacher2", pattern: "pt002", ปลายทาง: "รับทราบแล้ว", createdAt: "2026-09-08 12:05",
    title: "ปีนราวบันไดสไลเดอร์", zoneName: "โซน 2 สนามเด็กเล่น",
    description: "นักเรียนกลุ่มเล็กปีนขึ้นไปยืนบนราวบันไดสไลเดอร์ สูงจากพื้นประมาณ 2 เมตร และมีการผลักกันเล่น",
    บันทึก: { id: "rs002", message: "รับทราบ กำลังเดินไปจากโรงอาหาร", createdAt: "2026-09-08 12:06" } },
  { id: "al003", ครู: "teacher2", pattern: "pt003", ปลายทาง: "รอรับทราบ", createdAt: "2026-09-09 11:37",
    title: "รวมกลุ่มหนาแน่นมุมโรงอาหาร", zoneName: "โซน 3 โรงอาหาร",
    description: "นักเรียนมากกว่า 15 คนรวมตัวที่มุมหลังโรงอาหาร ยืนล้อมเป็นวงนานกว่า 2 นาที ยังไม่เห็นการเคลื่อนไหวรุนแรง" },
  { id: "al004", ครู: "teacher1", pattern: "pt002", ปลายทาง: "รอรับทราบ", createdAt: "2026-09-10 12:14",
    title: "วิ่งไล่กันบนอัฒจันทร์", zoneName: "โซน 1 สนามฟุตบอล",
    description: "นักเรียน 4–5 คนวิ่งไล่กันบนขั้นอัฒจันทร์ข้างสนามฟุตบอล และกระโดดข้ามขั้นลงมา" },
  { id: "al005", ครู: "teacher1", pattern: "pt001", ปลายทาง: "รอรับทราบ", createdAt: "2026-09-11 11:33",
    title: "เข้าแนวรั้วด้านประตูหลัง", zoneName: "โซน 5 ประตูหลัง",
    description: "นักเรียน 2 คนเดินเข้าไปในแนวรั้วด้านประตูหลัง ซึ่งกำหนดเป็นพื้นที่ต้องห้ามช่วงพักกลางวัน" }
];

const ลำดับสถานะ = ["รอรับทราบ", "รับทราบแล้ว", "ปิดเคส"];

for (const a of alerts) {
  const เจ้าของ = sessions[a.ครู];
  const เดิม = await firestore(admin.idToken, "GET", `alerts/${a.id}`);
  if (เดิม.status === 404) {
    await เขียน(admin, `alerts/${a.id}`, {
      title: a.title, description: a.description, zoneName: a.zoneName, status: "รอรับทราบ",
      createdAt: a.createdAt, teacherId: ครู[a.ครู].id, teacherName: ครู[a.ครู].name,
      patternId: a.pattern, patternName: patterns[a.pattern]
    });
    // ครูเจ้าของเปลี่ยนสถานะทีละขั้นจนถึงปลายทาง (แก้เฉพาะช่อง status ตามกฎ)
    for (const สถานะ of ลำดับสถานะ.slice(1, ลำดับสถานะ.indexOf(a.ปลายทาง) + 1)) {
      await เขียน(เจ้าของ, `alerts/${a.id}?updateMask.fieldPaths=status`, { status: สถานะ });
    }
    if (a.บันทึก) {
      await เขียน(เจ้าของ, `alerts/${a.id}/responses/${a.บันทึก.id}`, {
        authorId: เจ้าของ.uid, authorName: ครู[a.ครู].name, message: a.บันทึก.message, createdAt: a.บันทึก.createdAt
      });
    }
    console.log(`✔ alerts/${a.id} · ${a.ปลายทาง} · ${a.title}`);
  } else {
    console.log(`• มีอยู่แล้ว alerts/${a.id}`);
  }
}
console.log("✅ บัญชีทดสอบและข้อมูลตัวอย่างพร้อม");
