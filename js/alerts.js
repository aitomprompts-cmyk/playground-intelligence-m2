// ─────────────────────────────────────────────────────────────
// js/alerts.js — หน้ารายการแจ้งเตือน
// ─────────────────────────────────────────────────────────────

import { requireLogin, isAdmin, ROLE_TH } from "./auth.js";
import { listAlerts } from "./data.js";

const กล่อง = document.getElementById("ผลลัพธ์");
const หัวข้อย่อย = document.getElementById("subtitle");
const ที่วางปุ่มสร้าง = document.getElementById("ปุ่มสร้าง");

try {
  const user = await requireLogin();

  // แสดงหัวข้อย่อยตามบทบาท
  if (isAdmin(user.role)) {
    หัวข้อย่อย.textContent = "แจ้งเตือนเหตุการณ์ในโซนทั้งหมด · เรียงจากใหม่ไปเก่า";
    ที่วางปุ่มสร้าง.innerHTML = '<a class="btn" href="new-alert.html" style="margin-bottom: 16px;">+ สร้างแจ้งเตือน</a>';
  } else {
    หัวข้อย่อย.textContent = "แจ้งเตือนที่มอบให้คุณ · เรียงจากใหม่ไปเก่า";
  }

  // โหลดแจ้งเตือน
  const รายการ = await listAlerts(user);
  แสดงตาราง(รายการ);
} catch (err) {
  console.error(err);
  หัวข้อย่อย.textContent = "";
  กล่อง.innerHTML =
    '<div class="alert alert-error">' +
    '<p>⚠️ ' + esc(err.message) + '</p>' +
    '</div>';
}

function แสดงตาราง(รายการ) {
  if (รายการ.length === 0) {
    กล่อง.innerHTML = "<p>ยังไม่มีแจ้งเตือนในระบบ</p>";
    return;
  }

  let html =
    '<p class="count">ทั้งหมด ' + รายการ.length + " รายการ</p>" +
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
      '<tr class="clickable" data-id="' + esc(แจ้งเตือน.id) + '">' +
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

  // ให้คลิกแถวได้
  กล่อง.querySelectorAll("tr.clickable").forEach(function (row) {
    row.addEventListener("click", function () {
      const id = row.getAttribute("data-id");
      location.href = "alert-detail.html?id=" + encodeURIComponent(id);
    });
  });
}
