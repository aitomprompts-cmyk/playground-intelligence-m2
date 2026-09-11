// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — ค่าเชื่อมต่อ Firebase
// ใช้ได้ทั้งในเบราว์เซอร์ (ผ่าน import map ใน <head>) และใน Node (scripts/seed.mjs)
//
// 📌 วางค่าจาก Firebase Console → ⚙️ Project settings → Your apps → </>
//    แทนข้อความ "วางค่า-...-ที่นี่" ด้านล่างให้ครบทุกช่อง
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "วางค่า-apiKey-ที่นี่",
  authDomain: "วางค่า-authDomain-ที่นี่",
  projectId: "วางค่า-projectId-ที่นี่",
  storageBucket: "วางค่า-storageBucket-ที่นี่",
  messagingSenderId: "วางค่า-messagingSenderId-ที่นี่",
  appId: "วางค่า-appId-ที่นี่"
};

// ยังไม่ได้วางค่าจริง → หน้าเว็บขึ้นแถบเตือน และสคริปต์ seed หยุดพร้อมบอกวิธีแก้
export const ตั้งค่าแล้ว = !firebaseConfig.projectId.startsWith("วางค่า");

export const db = ตั้งค่าแล้ว ? getFirestore(initializeApp(firebaseConfig)) : null;
