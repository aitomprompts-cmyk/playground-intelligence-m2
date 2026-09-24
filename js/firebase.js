// ─────────────────────────────────────────────────────────────
// js/firebase.js — จุดเชื่อมต่อ Firebase จุดเดียวของทั้งระบบ Zone Alert
//
// ไฟล์อื่นทุกไฟล์ที่ต้องคุยกับ Firebase ให้ import จากไฟล์นี้เท่านั้น
// (import { app, auth, db } from "./firebase.js")
// ห้ามไปเรียก initializeApp ซ้ำที่ไฟล์อื่น เพราะ Firebase อนุญาตให้มี
// app หลักได้ชุดเดียวต่อหนึ่งหน้าเว็บ
//
// ค่าตั้งค่าจริง (apiKey ฯลฯ) อ่านจาก js/firebase-config.js ซึ่งเป็น
// ไฟล์ลับที่ไม่ถูก commit เข้า git — ถ้ายังไม่ได้สร้างไฟล์นี้ ให้คัดลอก
// js/firebase-config.example.js ไปตั้งชื่อใหม่แล้วใส่ค่าจริงลงไป
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

export let app = null;
export let auth = null;
export let db = null;

try {
  // ต้องใช้ dynamic import เพราะ js/firebase-config.js อาจยังไม่มีไฟล์อยู่จริง
  // (ยังไม่ได้ทำตามขั้นตอนตั้งค่า) — ถ้า import แบบ static แล้วไฟล์ไม่มีจริง
  // หน้าเว็บทั้งหน้าจะพังทันทีโดยไม่มีข้อความอธิบาย
  const { firebaseConfig } = await import("./firebase-config.js");

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (err) {
  const ข้อความ =
    "ไม่พบไฟล์ตั้งค่า js/firebase-config.js หรือค่าที่ใส่ไว้ไม่ถูกต้อง " +
    "— คัดลอก js/firebase-config.example.js ไปตั้งชื่อใหม่เป็น js/firebase-config.js " +
    "แล้วใส่ค่าจริงจาก Firebase Console ก่อนใช้งาน";

  console.error("[firebase.js]", ข้อความ, err);

  if (typeof showConfigWarning === "function") {
    // showConfigWarning เป็นฟังก์ชัน global จาก js/nav.js (โหลดเป็น classic script ก่อนไฟล์นี้)
    showConfigWarning(ข้อความ);
  } else {
    console.warn("[firebase.js] showConfigWarning ไม่พร้อมใช้งาน — แสดงเฉพาะข้อความใน console");
  }
}
