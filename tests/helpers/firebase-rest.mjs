// ─────────────────────────────────────────────────────────────
// tests/helpers/firebase-rest.mjs — ตัวช่วยของเทสต์: ล็อกอินและถาม Firestore ตรงผ่าน REST
//
// ใช้ในเทสต์ความปลอดภัย เพื่อพิสูจน์ว่า "ฐานข้อมูล" ปฏิเสธจริง ไม่ใช่แค่หน้าเว็บซ่อนไว้
// ทุกคำขอเป็นสิทธิ์ของผู้ใช้ธรรมดา (หรือไม่ล็อกอินเลย) — Security Rules ตัดสินทุกครั้ง
// ─────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";

// ค่าเว็บของ Firebase (ค่าสาธารณะ) อ่านจาก js/firebase-config.js
function webConfig() {
  const src = readFileSync(new URL("../../js/firebase-config.js", import.meta.url), "utf8");
  const pick = (k) => (src.match(new RegExp(`${k}:\\s*"([^"]+)"`)) || [])[1];
  return { apiKey: pick("apiKey"), projectId: pick("projectId") };
}
export const { apiKey, projectId } = webConfig();
const BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// ส่งที่มาเป็นเว็บที่เรียกจริง (เผื่อคีย์เว็บถูกจำกัดให้ใช้จากบางเว็บ)
export const AUTH_HEADERS = { "Content-Type": "application/json", Referer: process.env.BASE_URL || "http://localhost:3001/" };

export const ACCOUNTS = [
  { key: "teacher1", email: "tester.teacher1@example.com", name: "สมชาย ทดสอบ",  role: "duty_teacher", passwordVar: "TEST_TEACHER1_PASSWORD" },
  { key: "teacher2", email: "tester.teacher2@example.com", name: "สมหญิง ทดสอบ", role: "duty_teacher", passwordVar: "TEST_TEACHER2_PASSWORD" },
  { key: "admin",    email: "tester.admin@example.com",    name: "สมศรี ทดสอบ",  role: "admin",        passwordVar: "TEST_ADMIN_PASSWORD" }
];

// อ่าน .env.test (KEY=VALUE ต่อบรรทัด)
export function loadEnv() {
  const text = readFileSync(new URL("../../.env.test", import.meta.url), "utf8");
  return Object.fromEntries(text.split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
}

export function account(key) {
  const a = ACCOUNTS.find((x) => x.key === key);
  return { ...a, password: loadEnv()[a.passwordVar] };
}

// ล็อกอินแบบเดียวกับหน้าเว็บ ได้ idToken ของผู้ใช้คนนั้น
export async function signIn(email, password) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`ล็อกอิน ${email} ไม่สำเร็จ: ${body.error?.message}`);
  return { uid: body.localId, idToken: body.idToken };
}

export const signInAs = (key) => { const a = account(key); return signIn(a.email, a.password); };

// เรียก Firestore REST · idToken = null คือไม่ได้ล็อกอิน · fields เป็นข้อความทั้งหมด
export async function firestore(idToken, method, path, fields) {
  const headers = { "Content-Type": "application/json" };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const body = fields
    ? JSON.stringify({ fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, { stringValue: String(v) }])) })
    : undefined;
  const res = await fetch(`${BASE}/${path}`, { method, headers, body });
  return { ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) };
}

// ถามทั้งโฟลเดอร์ด้วย runQuery · where = { field, value } (ไม่ใส่ = ดึงทั้งโฟลเดอร์)
export async function runQuery(idToken, collectionId, where) {
  const headers = { "Content-Type": "application/json" };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const structuredQuery = { from: [{ collectionId }], limit: 100 };
  if (where) {
    structuredQuery.where = { fieldFilter: { field: { fieldPath: where.field }, op: "EQUAL", value: { stringValue: where.value } } };
  }
  const res = await fetch(`${BASE}:runQuery`, { method: "POST", headers, body: JSON.stringify({ structuredQuery }) });
  const body = await res.json().catch(() => ({}));
  const docs = Array.isArray(body) ? body.filter((r) => r.document).map((r) => fromDoc(r.document)) : [];
  return { ok: res.ok, status: res.status, body, docs };
}

// แปลงเอกสารจาก REST เป็นวัตถุธรรมดา
export function fromDoc(doc) {
  const out = { id: doc.name.split("/").pop() };
  for (const [k, v] of Object.entries(doc.fields || {})) out[k] = Object.values(v)[0];
  return out;
}

// ผู้ดูแลระบบสร้างแจ้งเตือนผ่าน REST (ใช้เตรียมข้อมูลในเทสต์) → คืน id
export async function createAlertAs(adminSession, fields) {
  const r = await firestore(adminSession.idToken, "POST", "alerts", { status: "รอรับทราบ", ...fields });
  if (!r.ok) throw new Error(`สร้างแจ้งเตือนไม่สำเร็จ: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.name.split("/").pop();
}

export function nowText() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
