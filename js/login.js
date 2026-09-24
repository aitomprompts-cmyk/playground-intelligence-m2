// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบและสมัครสมาชิก
// ─────────────────────────────────────────────────────────────

import { signIn, signUp } from "./auth.js";

const ฟอร์มเข้า = document.getElementById("ฟอร์มเข้าสู่ระบบ");
const ฟอร์มสมัคร = document.getElementById("ฟอร์มสมัครสมาชิก");
const กล่องเตือน = document.getElementById("ข้อความเตือน");

ฟอร์มเข้า.addEventListener("submit", async function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    แสดงข้อผิดพลาด("กรุณากรอกอีเมลและรหัสผ่าน");
    return;
  }

  await ประมวลการเข้าสู่ระบบ(email, password);
});

ฟอร์มสมัคร.addEventListener("submit", async function (e) {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  if (!name || !email || !password) {
    แสดงข้อผิดพลาด("กรุณากรอกชื่อ อีเมล และรหัสผ่าน");
    return;
  }

  await ประมวลการสมัครสมาชิก(name, email, password);
});

async function ประมวลการเข้าสู่ระบบ(email, password) {
  const ปุ่ม = document.getElementById("ปุ่มเข้าสู่ระบบ");
  const ข้อความเดิม = ปุ่ม.textContent;

  try {
    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลัง…";
    กล่องเตือน.classList.add("hidden");

    await signIn(email, password);
    location.href = "alerts.html";
  } catch (err) {
    แสดงข้อผิดพลาด(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
  } finally {
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = ข้อความเดิม;
  }
}

async function ประมวลการสมัครสมาชิก(name, email, password) {
  const ปุ่ม = document.getElementById("ปุ่มสมัคร");
  const ข้อความเดิม = ปุ่ม.textContent;

  try {
    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลัง…";
    กล่องเตือน.classList.add("hidden");

    await signUp(name, email, password);
    location.href = "alerts.html";
  } catch (err) {
    แสดงข้อผิดพลาด(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
  } finally {
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = ข้อความเดิม;
  }
}

function แสดงข้อผิดพลาด(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + esc(ข้อความ);
  กล่องเตือน.classList.remove("hidden");
}

// ปุ่มในหน้า HTML เริ่มแบบกดไม่ได้ — เปิดให้กดเมื่อโค้ดพร้อมแล้วเท่านั้น
// ไม่งั้นถ้าเน็ตช้าแล้วกดเร็ว เบราว์เซอร์จะส่งฟอร์มเองแบบเดิม ๆ แล้วแค่โหลดหน้าใหม่ ล็อกอินไม่สำเร็จ
document.getElementById("ปุ่มเข้าสู่ระบบ").disabled = false;
document.getElementById("ปุ่มสมัคร").disabled = false;
