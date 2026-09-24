// ─────────────────────────────────────────────────────────────
// js/auth.js — ล็อกอิน สมัครสมาชิก และข้อมูลผู้ใช้ปัจจุบันของ Zone Alert
//
// ทุกหน้าที่ต้องล็อกอินก่อนถึงจะใช้งานได้ ให้เรียก requireLogin()
// เป็นอย่างแรกก่อนอ่าน/เขียนข้อมูลอื่นใด
// ─────────────────────────────────────────────────────────────

import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// บทบาทเป็นคำไทยที่ใช้แสดงบนหน้าจอ — ค่าในฐานข้อมูลยังเป็นรหัสอังกฤษเสมอ
export const ROLE_TH = {
  duty_teacher: "ครูเวร",
  admin: "ผู้ดูแลระบบ"
};

// ผู้ดูแลระบบเท่านั้นที่ isAdmin(role) คืนค่าจริง
export function isAdmin(role) {
  return role === "admin";
}

// บทบาทที่คาดว่าอีเมลนี้ควรได้ ต้องเหมือนกับฟังก์ชัน roleForEmail ใน firestore.rules เป๊ะ
// (รายชื่อนี้คือบัญชีทดสอบของผู้ดูแลระบบ — ใครสมัครนอกรายชื่อนี้ได้บทบาท duty_teacher เสมอ
// สมัครสมาชิกใหม่ตั้งตัวเองเป็น admin จากหน้าเว็บไม่ได้)
export function expectedRole(email) {
  const แผนที่บทบาท = {
    "tester.admin@example.com": "admin"
  };
  return แผนที่บทบาท[email] || "duty_teacher";
}

// แปลงข้อความให้ปลอดภัยก่อนวางลง innerHTML (ไม่พึ่ง util.js เพื่อไม่ให้ไฟล์นี้ผูกกับลำดับโหลดสคริปต์)
function escSafe(ข้อความ) {
  return String(ข้อความ == null ? "" : ข้อความ)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// แปลรหัสข้อผิดพลาดของ Firebase Authentication ให้เป็นข้อความไทยที่อ่านแล้วรู้ว่าต้องทำอะไรต่อ
function ข้อความผิดพลาดจากรหัส(err) {
  const รหัส = (err && err.code) || "";
  const แผนที่ = {
    "auth/wrong-password": "รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่อีกครั้ง",
    "auth/user-not-found": "ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบอีเมล หรือสมัครสมาชิกก่อนเข้าสู่ระบบ",
    "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่อีกครั้ง",
    "auth/email-already-in-use": "อีเมลนี้มีผู้สมัครไว้แล้ว กรุณาเข้าสู่ระบบแทน หรือใช้อีเมลอื่นในการสมัคร",
    "auth/weak-password": "รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร กรุณาตั้งรหัสผ่านใหม่",
    "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบและพิมพ์อีเมลใหม่อีกครั้ง",
    "auth/network-request-failed": "เชื่อมต่ออินเทอร์เน็ตไม่ได้ กรุณาตรวจสอบสัญญาณอินเทอร์เน็ตแล้วลองใหม่",
    "auth/too-many-requests": "พยายามเข้าสู่ระบบผิดพลาดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง"
  };
  return แผนที่[รหัส] || ("เกิดข้อผิดพลาดที่ไม่คาดคิด (" + (รหัส || "ไม่ทราบสาเหตุ") + ") กรุณาลองใหม่อีกครั้ง");
}

// อ่านไฟล์ users/{uid} ของผู้ใช้ปัจจุบัน ถ้ายังไม่มีไฟล์ (เช่น สมัครสมาชิกแล้วขั้นตอนสร้างไฟล์ถูกขัดจังหวะ)
// ให้สร้างไฟล์ใหม่ให้อัตโนมัติด้วยบทบาทที่คาดว่าอีเมลนี้ควรได้
async function โหลดหรือสร้างโปรไฟล์ผู้ใช้(user) {
  const อ้างอิงไฟล์ = doc(db, "users", user.uid);
  const สแนปช็อต = await getDoc(อ้างอิงไฟล์);

  if (สแนปช็อต.exists()) {
    const ข้อมูล = สแนปช็อต.data();
    return { uid: user.uid, name: ข้อมูล.name, email: ข้อมูล.email, role: ข้อมูล.role };
  }

  const อีเมล = (user.email || "").trim().toLowerCase();
  const โปรไฟล์ใหม่ = {
    name: อีเมล.split("@")[0] || "ผู้ใช้ใหม่",
    email: อีเมล,
    role: expectedRole(อีเมล)
  };
  await setDoc(อ้างอิงไฟล์, โปรไฟล์ใหม่);
  return { uid: user.uid, ...โปรไฟล์ใหม่ };
}

// เติมชื่อ + บทบาท + ปุ่มออกจากระบบ ลงในแถบเมนู #navUser (ถ้าหน้านั้นมีช่องนี้)
function แสดงผู้ใช้บนแถบเมนู(profile) {
  const กล่อง = document.getElementById("navUser");
  if (!กล่อง) return;

  const บทบาทไทย = ROLE_TH[profile.role] || profile.role;
  กล่อง.innerHTML =
    escSafe(profile.name) + " · " + escSafe(บทบาทไทย) + " " +
    '<button type="button" class="btn-ghost" id="ปุ่มออกจากระบบ">ออกจากระบบ</button>';

  const ปุ่มออก = document.getElementById("ปุ่มออกจากระบบ");
  if (ปุ่มออก) {
    ปุ่มออก.addEventListener("click", async function () {
      try {
        await signOutUser();
      } catch (err) {
        console.error("[auth.js] signOutUser", err);
      } finally {
        location.href = "login.html";
      }
    });
  }
}

// รอสถานะล็อกอินให้พร้อมก่อน (การเช็คครั้งแรกของ Firebase Auth ไม่ใช่ทันทีที่โหลดหน้า)
// - ไม่ได้ล็อกอิน → พาไปหน้า login.html แล้วคืน Promise ที่ไม่มีวัน resolve
//   (หน้าเว็บกำลังจะเปลี่ยนไปหน้าอื่นอยู่แล้ว โค้ดหลังจากนี้จึงไม่ควรทำงานต่อ)
// - ล็อกอินอยู่ → คืนข้อมูลผู้ใช้ { uid, name, email, role } และเติม #navUser ให้
export function requireLogin() {
  return new Promise(function (resolve) {
    const เลิกฟัง = onAuthStateChanged(auth, async function (user) {
      เลิกฟัง();

      if (!user) {
        location.href = "login.html";
        return;
      }

      try {
        const profile = await โหลดหรือสร้างโปรไฟล์ผู้ใช้(user);
        แสดงผู้ใช้บนแถบเมนู(profile);
        resolve(profile);
      } catch (err) {
        console.error("[auth.js] requireLogin: อ่านข้อมูลผู้ใช้ไม่สำเร็จ", err);
        // อ่านโปรไฟล์ไม่สำเร็จ (เช่น Firestore ปฏิเสธ) — ปลอดภัยกว่าที่จะพาไปหน้า login ใหม่
        location.href = "login.html";
      }
    });
  });
}

// สมัครสมาชิกใหม่ → ได้บทบาท duty_teacher เสมอ (เว้นแต่อีเมลอยู่ในรายชื่อบัญชีทดสอบผู้ดูแลระบบ)
export async function signUp(name, email, password) {
  // Firebase เก็บอีเมลเป็นตัวพิมพ์เล็กเสมอ — ต้องตรงกับ request.auth.token.email ในกฎ
  email = String(email || "").trim().toLowerCase();
  try {
    const ผลลัพธ์ = await createUserWithEmailAndPassword(auth, email, password);
    const โปรไฟล์ = { name: name, email: email, role: expectedRole(email) };
    await setDoc(doc(db, "users", ผลลัพธ์.user.uid), โปรไฟล์);
    return { uid: ผลลัพธ์.user.uid, ...โปรไฟล์ };
  } catch (err) {
    throw new Error(ข้อความผิดพลาดจากรหัส(err));
  }
}

export async function signIn(email, password) {
  try {
    const ผลลัพธ์ = await signInWithEmailAndPassword(auth, email, password);
    return ผลลัพธ์.user;
  } catch (err) {
    throw new Error(ข้อความผิดพลาดจากรหัส(err));
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    throw new Error("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือรีเฟรชหน้าเว็บ");
  }
}
