// ─────────────────────────────────────────────────────────────
// js/alerts.js — หน้ารายการแจ้งเตือน
// สัปดาห์ที่ 6: อ่านจาก Firestore จริง (ผ่าน js/data.js)
// ─────────────────────────────────────────────────────────────

import { ตั้งค่าแล้ว } from "./firebase-config.js";
import { getAlerts } from "./data.js";

const กล่อง = document.getElementById("ผลลัพธ์");

if (!ตั้งค่าแล้ว) {
  showConfigWarning();
  กล่อง.innerHTML = "<p>ยังอ่านข้อมูลไม่ได้ — ต้องวางค่า firebaseConfig ในไฟล์ js/firebase-config.js ก่อน</p>";
} else {
  try {
    แสดงตาราง(await getAlerts());
  } catch (err) {
    console.error(err);
    กล่อง.innerHTML =
      '<p class="error">อ่านข้อมูลจาก Firestore ไม่สำเร็จ: ' + esc(err.message) + "</p>" +
      "<p>ถ้าขึ้น permission denied ให้ตรวจว่าเลือก Test mode ตอนสร้างฐานข้อมูล</p>";
  }
}

function แสดงตาราง(รายการ) {
  if (รายการ.length === 0) {
    กล่อง.innerHTML = "<p>ยังไม่มีแจ้งเตือนในระบบ — รัน <code>npm run seed</code> เพื่อใส่ข้อมูลตัวอย่าง</p>";
    return;
  }

  let html =
    '<p class="count">ทั้งหมด ' + รายการ.length + " รายการ · เรียงจากใหม่ไปเก่า</p>" +
    '<div class="table-wrap"><table><thead><tr>' +
    "<th>เวลา</th>" +
    "<th>โซน</th>" +
    "<th>เหตุการณ์</th>" +
    '<th class="hide-mobile">ประเภท</th>' +
    "<th>สถานะ</th>" +
    '<th class="hide-mobile">ครูเวรที่รับผิดชอบ</th>' +
    "</tr></thead><tbody>";

  for (const แจ้งเตือน of รายการ) {
    html +=
      "<tr>" +
      '<td class="time">' + esc(แจ้งเตือน.createdAt) + "</td>" +
      '<td class="zone">' + esc(แจ้งเตือน.zoneName) + "</td>" +
      "<td>" + esc(แจ้งเตือน.title) + "</td>" +
      '<td class="hide-mobile">' + esc(แจ้งเตือน.patternName) + "</td>" +
      "<td>" + ป้ายสถานะ(แจ้งเตือน.status) + "</td>" +
      '<td class="hide-mobile">' + esc(แจ้งเตือน.teacherName) + "</td>" +
      "</tr>";
  }

  html += "</tbody></table></div>";
  กล่อง.innerHTML = html;
}
