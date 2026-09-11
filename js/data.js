// ─────────────────────────────────────────────────────────────
// js/data.js — อ่านข้อมูลจาก Firestore (สัปดาห์ที่ 6: อ่านอย่างเดียว)
//
// โครงสร้างตาม DATA-STRUCTURE.md:
//   📁 users/{id}          { name, email, role }
//   📁 alertPatterns/{id}  { name }
//   📁 alerts/{id}         { title, description, zoneName, status, createdAt,
//                            teacherId, teacherName, patternId, patternName }
//      📁 responses/{id}   { authorId, authorName, message, createdAt }   ← subcollection
//
// การเขียน (สร้างแจ้งเตือน, เปลี่ยนสถานะ, เขียนบันทึก) เป็นงานของสัปดาห์ที่ 7
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

function เป็นรายการ(snap) {
  return snap.docs.map(function (d) { return { id: d.id, ...d.data() }; });
}

// เรียงจากใหม่ไปเก่าตาม createdAt (ข้อความ "YYYY-MM-DD HH:mm" เรียงตามตัวอักษรได้ตรงกับเวลา)
export async function getAlerts() {
  const snap = await getDocs(query(collection(db, "alerts"), orderBy("createdAt", "desc")));
  return เป็นรายการ(snap);
}
