// ─────────────────────────────────────────────────────────────
// js/firebase-config.example.js — ตัวอย่างไฟล์ตั้งค่า Firebase ของ Zone Alert
//
// วิธีใช้:
//   1) คัดลอกไฟล์นี้แล้วตั้งชื่อใหม่ว่า  js/firebase-config.js
//   2) เอาค่าจริงจาก Firebase Console (⚙️ Project settings → General
//      → Your apps → SDK setup and configuration) ของโปรเจกต์ zone-alert-pi-m2
//      มาใส่แทนค่าตัวอย่างข้างล่าง
//   3) js/firebase-config.js ห้าม commit เข้า git เด็ดขาด
//      (ไฟล์นี้ถูกกันไว้ใน .gitignore ให้แล้ว — อย่าลบบรรทัดนั้นออก)
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "ใส่ค่า apiKey ของโปรเจกต์คุณ",
  authDomain: "ใส่ค่า authDomain ของโปรเจกต์คุณ",
  projectId: "ใส่ค่า projectId ของโปรเจกต์คุณ",
  storageBucket: "ใส่ค่า storageBucket ของโปรเจกต์คุณ",
  messagingSenderId: "ใส่ค่า messagingSenderId ของโปรเจกต์คุณ",
  appId: "ใส่ค่า appId ของโปรเจกต์คุณ"
};
