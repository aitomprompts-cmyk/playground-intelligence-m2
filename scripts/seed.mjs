// ─────────────────────────────────────────────────────────────
// scripts/seed.mjs — ใส่ข้อมูลตัวอย่างลง Firestore (ส่วน C ของการบ้าน)
// วิธีรัน: npm run seed
//
// ใช้ id ตายตัว (u001, pt001, al001 …) รันซ้ำกี่ครั้งก็ได้ ข้อมูลจะถูกเขียนทับ ไม่เพิ่มซ้ำ
// ⚠️ ชื่อทุกชื่อเป็นชื่อสมมติ · อีเมลเป็นอีเมลตัวอย่าง · ห้ามใส่ข้อมูลจริงของครูหรือนักเรียน
// ─────────────────────────────────────────────────────────────

import { db, ตั้งค่าแล้ว } from "../js/firebase-config.js";
import { doc, setDoc, terminate } from "firebase/firestore";

if (!ตั้งค่าแล้ว) {
  console.error("❌ ยังไม่ได้วางค่า firebaseConfig ในไฟล์ js/firebase-config.js");
  console.error("   ทำตามขั้นตอน 'ตั้งค่า Firestore' ใน README.md ก่อน แล้วรัน npm run seed อีกครั้ง");
  process.exit(1);
}

const users = [
  { id: "u001", name: "สมชาย ใจดี",   email: "somchai@example.com", role: "duty_teacher" },
  { id: "u002", name: "สมหญิง รักงาน", email: "somying@example.com", role: "duty_teacher" },
  { id: "u003", name: "สมศรี ตั้งใจ",  email: "somsri@example.com",  role: "admin" }
];

const alertPatterns = [
  { id: "pt001", name: "เข้าพื้นที่ต้องห้าม" },
  { id: "pt002", name: "เล่นเสี่ยงอันตราย" },
  { id: "pt003", name: "รวมกลุ่มผิดปกติ" }
];

// 5 รายการ: 3 รอรับทราบ · 1 รับทราบแล้ว · 1 ปิดเคส
const alerts = [
  {
    id: "al001",
    title: "นักเรียนเข้าเขตหลังอาคาร 3",
    description: "กล้องจุดที่ 4 เห็นนักเรียนประมาณ 3 คนเดินผ่านแนวกั้นเข้าไปหลังอาคาร 3 ซึ่งเป็นพื้นที่ต้องห้ามช่วงพักกลางวัน อยู่ในพื้นที่นานเกิน 30 วินาที",
    zoneName: "โซน 4 หลังอาคาร 3",
    status: "ปิดเคส",
    teacherId: "u001", teacherName: "สมชาย ใจดี",
    patternId: "pt001", patternName: "เข้าพื้นที่ต้องห้าม",
    createdAt: "2026-09-07 11:48",
    responses: [
      { id: "rs001", authorId: "u001", authorName: "สมชาย ใจดี",
        message: "ถึงจุดแล้ว พานักเรียนออกจากพื้นที่ และย้ำกติกาเรื่องเขตห้ามเข้าเรียบร้อย",
        createdAt: "2026-09-07 11:53" }
    ]
  },
  {
    id: "al002",
    title: "ปีนราวบันไดสไลเดอร์",
    description: "นักเรียนกลุ่มเล็กปีนขึ้นไปยืนบนราวบันไดสไลเดอร์ สูงจากพื้นประมาณ 2 เมตร และมีการผลักกันเล่น",
    zoneName: "โซน 2 สนามเด็กเล่น",
    status: "รับทราบแล้ว",
    teacherId: "u002", teacherName: "สมหญิง รักงาน",
    patternId: "pt002", patternName: "เล่นเสี่ยงอันตราย",
    createdAt: "2026-09-08 12:05",
    responses: [
      { id: "rs002", authorId: "u002", authorName: "สมหญิง รักงาน",
        message: "รับทราบ กำลังเดินไปจากโรงอาหาร",
        createdAt: "2026-09-08 12:06" }
    ]
  },
  {
    id: "al003",
    title: "รวมกลุ่มหนาแน่นมุมโรงอาหาร",
    description: "นักเรียนมากกว่า 15 คนรวมตัวที่มุมหลังโรงอาหาร ยืนล้อมเป็นวงนานกว่า 2 นาที ยังไม่เห็นการเคลื่อนไหวรุนแรง",
    zoneName: "โซน 3 โรงอาหาร",
    status: "รอรับทราบ",
    teacherId: "u002", teacherName: "สมหญิง รักงาน",
    patternId: "pt003", patternName: "รวมกลุ่มผิดปกติ",
    createdAt: "2026-09-09 11:37",
    responses: []
  },
  {
    id: "al004",
    title: "วิ่งไล่กันบนอัฒจันทร์",
    description: "นักเรียน 4–5 คนวิ่งไล่กันบนขั้นอัฒจันทร์ข้างสนามฟุตบอล และกระโดดข้ามขั้นลงมา",
    zoneName: "โซน 1 สนามฟุตบอล",
    status: "รอรับทราบ",
    teacherId: "u001", teacherName: "สมชาย ใจดี",
    patternId: "pt002", patternName: "เล่นเสี่ยงอันตราย",
    createdAt: "2026-09-10 12:14",
    responses: []
  },
  {
    id: "al005",
    title: "เข้าแนวรั้วด้านประตูหลัง",
    description: "นักเรียน 2 คนเดินเข้าไปในแนวรั้วด้านประตูหลัง ซึ่งกำหนดเป็นพื้นที่ต้องห้ามช่วงพักกลางวัน",
    zoneName: "โซน 5 ประตูหลัง",
    status: "รอรับทราบ",
    teacherId: "u001", teacherName: "สมชาย ใจดี",
    patternId: "pt001", patternName: "เข้าพื้นที่ต้องห้าม",
    createdAt: "2026-09-11 11:33",
    responses: []
  }
];

let จำนวนบันทึก = 0;

for (const { id, ...ข้อมูล } of users) {
  await setDoc(doc(db, "users", id), ข้อมูล);
  console.log("  users/" + id + " · " + ข้อมูล.name);
}
for (const { id, ...ข้อมูล } of alertPatterns) {
  await setDoc(doc(db, "alertPatterns", id), ข้อมูล);
  console.log("  alertPatterns/" + id + " · " + ข้อมูล.name);
}
for (const { id, responses, ...ข้อมูล } of alerts) {
  await setDoc(doc(db, "alerts", id), ข้อมูล);
  console.log("  alerts/" + id + " · " + ข้อมูล.status + " · " + ข้อมูล.title);
  for (const { id: idบันทึก, ...ข้อมูลบันทึก } of responses) {
    await setDoc(doc(db, "alerts", id, "responses", idบันทึก), ข้อมูลบันทึก);
    console.log("    └ responses/" + idบันทึก + " · " + ข้อมูลบันทึก.authorName);
    จำนวนบันทึก++;
  }
}

console.log(
  "✅ ใส่ข้อมูลตัวอย่างสำเร็จ: users " + users.length +
  " · alertPatterns " + alertPatterns.length +
  " · alerts " + alerts.length +
  " · responses " + จำนวนบันทึก
);

await terminate(db);
process.exit(0);
