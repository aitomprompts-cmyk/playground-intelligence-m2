// ─────────────────────────────────────────────────────────────
// js/data.js — จุดเดียวที่คุยกับ Firestore เรื่องข้อมูลของ Zone Alert
//
// ทุกฟังก์ชันเป็น async ทุกฟังก์ชัน · ผิดพลาดจะ throw Error ที่ข้อความ
// เป็นภาษาไทย บอกว่าเกิดอะไรขึ้นและควรทำอะไรต่อ (ไม่ throw รหัส/อ็อบเจกต์ดิบ)
//
// ชื่อโฟลเดอร์และชื่อช่องข้อมูลสะกดตาม spec.md หัวข้อ 5 เป๊ะ:
//   📁 users/{uid}            { name, email, role }
//   📁 alertPatterns/{id}     { name }
//   📁 alerts/{id}            { title, description, zoneName, status, createdAt,
//                               teacherId, teacherName, patternId, patternName }
//      📁 responses/{id}      { authorId, authorName, message, createdAt }
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// สถานะถัดไปตามลูกศร (spec.md หัวข้อ 6) — ใช้ทั้งฝั่งหน้าจอและตรวจก่อนเรียก setStatus
export const NEXT_STATUS = {
  "รอรับทราบ": "รับทราบแล้ว",
  "รับทราบแล้ว": "ปิดเคส"
};

// เวลาปัจจุบันรูปแบบ "YYYY-MM-DD HH:mm" (เรียงตามตัวอักษรได้ตรงกับเวลา)
// ทำสำเนาไว้ในไฟล์นี้เอง เพื่อไม่ให้ js/data.js (ES module) ต้องพึ่งลำดับโหลดของ
// js/util.js (classic script) ซึ่งบางหน้าอาจยังไม่ได้แนบสคริปต์นั้นไว้
function nowText() {
  const d = new Date();
  const สองหลัก = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() + "-" + สองหลัก(d.getMonth() + 1) + "-" + สองหลัก(d.getDate()) +
    " " + สองหลัก(d.getHours()) + ":" + สองหลัก(d.getMinutes())
  );
}

// แปลรหัสข้อผิดพลาดของ Firestore ให้เป็นข้อความไทยที่บอกว่าเกิดอะไรและควรทำอะไรต่อ
function ข้อความจากรหัส(err, การกระทำ) {
  const รหัส = err && err.code;
  if (รหัส === "permission-denied") {
    return "คุณไม่มีสิทธิ์" + การกระทำ + " กรุณาตรวจสอบว่าเข้าสู่ระบบด้วยบัญชีที่ถูกต้อง หรือติดต่อผู้ดูแลระบบ";
  }
  if (รหัส === "unavailable" || รหัส === "deadline-exceeded") {
    return "เชื่อมต่อฐานข้อมูลไม่ได้ในขณะนี้ กรุณาตรวจสอบสัญญาณอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง";
  }
  if (รหัส === "not-found") {
    return "ไม่พบข้อมูลที่ต้องการ — อาจถูกลบไปแล้ว กรุณากลับไปหน้ารายการแล้วลองใหม่";
  }
  return "เกิดข้อผิดพลาดขณะ" + การกระทำ + " กรุณาลองใหม่อีกครั้ง" + (รหัส ? " (" + รหัส + ")" : "");
}

function ไฟล์พร้อมรหัส(สแนปช็อต) {
  return { id: สแนปช็อต.id, ...สแนปช็อต.data() };
}

// ── แจ้งเตือน ─────────────────────────────────────────────────

// รายการแจ้งเตือน เรียงใหม่ไปเก่าตาม createdAt
// admin เห็นทุกใบ · duty_teacher เห็นเฉพาะที่ teacherId เป็นของตัวเอง · จำกัด 100 ใบ
export async function listAlerts(user) {
  try {
    const โฟลเดอร์ = collection(db, "alerts");
    let สแนปช็อต;

    if (user && user.role === "admin") {
      const q = query(โฟลเดอร์, orderBy("createdAt", "desc"), limit(100));
      สแนปช็อต = await getDocs(q);
      return สแนปช็อต.docs.map(ไฟล์พร้อมรหัส);
    }

    // ครูเวร: กรองด้วย teacherId เท่านั้น (ไม่ orderBy ร่วมกับ where ต่างช่อง
    // เพื่อเลี่ยงการต้องสร้าง composite index) แล้วมาเรียงใหม่ไปเก่าฝั่งหน้าเว็บแทน
    const q = query(โฟลเดอร์, where("teacherId", "==", user.uid), limit(100));
    สแนปช็อต = await getDocs(q);
    const รายการ = สแนปช็อต.docs.map(ไฟล์พร้อมรหัส);
    รายการ.sort((a, b) => (b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0));
    return รายการ;
  } catch (err) {
    throw new Error(ข้อความจากรหัส(err, "เปิดรายการแจ้งเตือน"));
  }
}

// แจ้งเตือนหนึ่งใบ หรือ null ถ้าไม่พบ
export async function getAlert(id) {
  try {
    const สแนปช็อต = await getDoc(doc(db, "alerts", id));
    return สแนปช็อต.exists() ? ไฟล์พร้อมรหัส(สแนปช็อต) : null;
  } catch (err) {
    if (err && err.code === "permission-denied") {
      throw new Error(
        "คุณไม่มีสิทธิ์เปิดแจ้งเตือนนี้ — เห็นได้เฉพาะแจ้งเตือนของตัวเอง ถ้าเป็นผู้ดูแลระบบ " +
          "กรุณาตรวจสอบว่าเข้าสู่ระบบถูกบัญชี"
      );
    }
    throw new Error(ข้อความจากรหัส(err, "เปิดแจ้งเตือนนี้"));
  }
}

// สร้างแจ้งเตือนใหม่ (ผู้ดูแลระบบ) — สถานะเริ่มต้นเป็น รอรับทราบ เสมอ ตั้งให้อัตโนมัติ ไม่ให้ผู้ใช้เลือกเอง
export async function createAlert({ title, description, zoneName, patternId, patternName, teacherId, teacherName }) {
  try {
    const ผลลัพธ์ = await addDoc(collection(db, "alerts"), {
      title,
      description,
      zoneName,
      status: "รอรับทราบ",
      createdAt: nowText(),
      teacherId,
      teacherName,
      patternId,
      patternName
    });
    return ผลลัพธ์.id;
  } catch (err) {
    throw new Error(ข้อความจากรหัส(err, "สร้างแจ้งเตือนนี้"));
  }
}

// เปลี่ยนสถานะแจ้งเตือน — แก้เฉพาะช่อง status ห้ามเขียนทับช่องอื่นในไฟล์เดิม
export async function setStatus(id, status) {
  try {
    await updateDoc(doc(db, "alerts", id), { status });
  } catch (err) {
    throw new Error(ข้อความจากรหัส(err, "เปลี่ยนสถานะแจ้งเตือนนี้"));
  }
}

// ลบแจ้งเตือน — ต้องลบบันทึกในโฟลเดอร์ย่อย responses ให้หมดก่อน แล้วจึงลบไฟล์แจ้งเตือน
export async function deleteAlert(id) {
  try {
    const โฟลเดอร์บันทึก = collection(db, "alerts", id, "responses");
    const สแนปช็อต = await getDocs(โฟลเดอร์บันทึก);
    await Promise.all(สแนปช็อต.docs.map((ไฟล์) => deleteDoc(ไฟล์.ref)));
    await deleteDoc(doc(db, "alerts", id));
  } catch (err) {
    throw new Error(ข้อความจากรหัส(err, "ลบแจ้งเตือนนี้"));
  }
}

// ── บันทึกการตอบสนอง (โฟลเดอร์ย่อยของแจ้งเตือนแต่ละใบ) ─────────────

// รายการบันทึก เรียงเก่าไปใหม่
export async function listResponses(id) {
  try {
    const q = query(collection(db, "alerts", id, "responses"), orderBy("createdAt", "asc"));
    const สแนปช็อต = await getDocs(q);
    return สแนปช็อต.docs.map(ไฟล์พร้อมรหัส);
  } catch (err) {
    throw new Error(ข้อความจากรหัส(err, "เปิดรายการบันทึกของแจ้งเตือนนี้"));
  }
}

// เพิ่มบันทึกใหม่ในโฟลเดอร์ย่อย responses ของแจ้งเตือนนั้น
export async function addResponse(id, user, message) {
  const ข้อความ = (message || "").trim();
  if (!ข้อความ) {
    throw new Error("พิมพ์ข้อความบันทึกก่อนกดส่ง — ส่งข้อความว่างเปล่าไม่ได้");
  }
  try {
    await addDoc(collection(db, "alerts", id, "responses"), {
      authorId: user.uid,
      authorName: user.name,
      message: ข้อความ,
      createdAt: nowText()
    });
  } catch (err) {
    throw new Error(ข้อความจากรหัส(err, "ส่งบันทึกนี้"));
  }
}

// ── ประเภทเหตุการณ์ ────────────────────────────────────────────

export async function listPatterns() {
  try {
    const q = query(collection(db, "alertPatterns"), orderBy("name", "asc"));
    const สแนปช็อต = await getDocs(q);
    return สแนปช็อต.docs.map(ไฟล์พร้อมรหัส);
  } catch (err) {
    throw new Error(ข้อความจากรหัส(err, "เปิดรายการประเภทเหตุการณ์"));
  }
}

export async function addPattern(name) {
  const ชื่อ = (name || "").trim();
  if (!ชื่อ) {
    throw new Error("พิมพ์ชื่อประเภทเหตุการณ์ก่อน จึงจะเพิ่มได้");
  }
  try {
    const ผลลัพธ์ = await addDoc(collection(db, "alertPatterns"), { name: ชื่อ });
    return ผลลัพธ์.id;
  } catch (err) {
    throw new Error(ข้อความจากรหัส(err, "เพิ่มประเภทเหตุการณ์นี้"));
  }
}

export async function updatePattern(id, name) {
  const ชื่อ = (name || "").trim();
  if (!ชื่อ) {
    throw new Error("ชื่อประเภทเหตุการณ์ว่างเปล่าไม่ได้");
  }
  try {
    await updateDoc(doc(db, "alertPatterns", id), { name: ชื่อ });
  } catch (err) {
    throw new Error(ข้อความจากรหัส(err, "แก้ไขประเภทเหตุการณ์นี้"));
  }
}

export async function deletePattern(id) {
  try {
    await deleteDoc(doc(db, "alertPatterns", id));
  } catch (err) {
    throw new Error(ข้อความจากรหัส(err, "ลบประเภทเหตุการณ์นี้"));
  }
}

// ── ครูเวร (ใช้ในรายการเลื่อนลงตอนผู้ดูแลระบบสร้างแจ้งเตือน) ────────

export async function listTeachers() {
  try {
    const q = query(collection(db, "users"), where("role", "==", "duty_teacher"));
    const สแนปช็อต = await getDocs(q);
    const รายการ = สแนปช็อต.docs.map(ไฟล์พร้อมรหัส);
    รายการ.sort((a, b) => String(a.name).localeCompare(String(b.name), "th"));
    return รายการ;
  } catch (err) {
    throw new Error(ข้อความจากรหัส(err, "เปิดรายชื่อครูเวร"));
  }
}
