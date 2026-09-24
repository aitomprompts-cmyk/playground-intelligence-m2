// ─────────────────────────────────────────────────────────────
// js/alert-detail.js — หน้ารายละเอียดแจ้งเตือน
// ─────────────────────────────────────────────────────────────

import { requireLogin, isAdmin } from "./auth.js";
import { getAlert, setStatus, deleteAlert, listResponses, addResponse, NEXT_STATUS } from "./data.js";

const กล่องแจ้งเตือน = document.getElementById("กล่องแจ้งเตือน");
const ที่วางปุ่ม = document.getElementById("ปุ่มการกระทำ");
const ข้อความบันทึก = document.getElementById("ข้อความบันทึก");
const ปุ่มส่งบันทึก = document.getElementById("ปุ่มส่งบันทึก");
const รายการบันทึก = document.getElementById("รายการบันทึก");
const เตือนบันทึก = document.getElementById("เตือนบันทึก");

let user = null;
let alert = null;
const alertId = getQueryParam("id");

// โหลดข้อมูล
try {
  user = await requireLogin();

  if (!alertId) {
    throw new Error("ไม่พบรหัสแจ้งเตือน");
  }

  alert = await getAlert(alertId);
  if (!alert) {
    throw new Error("ไม่พบแจ้งเตือนที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง");
  }

  แสดงรายละเอียด();
  โหลดบันทึก();
} catch (err) {
  console.error(err);
  กล่องแจ้งเตือน.innerHTML =
    '<div class="alert alert-error">' +
    '<p>⚠️ ' + esc(err.message) + '</p>' +
    '</div>';
  document.getElementById("บันทึกการ์ด").style.display = "none";
}

function แสดงรายละเอียด() {
  let html = '<div class="field-row"><strong>หัวข้อ:</strong><span>' + esc(alert.title) + '</span></div>';
  html += '<div class="field-row"><strong>รายละเอียด:</strong><span>' + esc(alert.description) + '</span></div>';
  html += '<div class="field-row"><strong>โซน:</strong><span>' + esc(alert.zoneName) + '</span></div>';
  html += '<div class="field-row"><strong>ประเภท:</strong><span>' + esc(alert.patternName) + '</span></div>';
  html += '<div class="field-row"><strong>ครูเวร:</strong><span>' + esc(alert.teacherName) + '</span></div>';
  html += '<div class="field-row"><strong>สถานะ:</strong><span>' + ป้ายสถานะ(alert.status) + '</span></div>';
  html += '<div class="field-row"><strong>เวลาที่แจ้ง:</strong><span>' + esc(alert.createdAt) + '</span></div>';

  กล่องแจ้งเตือน.innerHTML = html;

  // แสดงปุ่มเปลี่ยนสถานะถ้าเป็นครูเวรเจ้าของหรือ admin
  if (alert.teacherId === user.uid || isAdmin(user.role)) {
    if (alert.status === "รอรับทราบ") {
      ที่วางปุ่ม.innerHTML = '<button id="ปุ่มรับทราบ" class="btn btn-blue">รับทราบ</button>';
      document.getElementById("ปุ่มรับทราบ").addEventListener("click", ประมวลเปลี่ยนสถานะ);
    } else if (alert.status === "รับทราบแล้ว") {
      ที่วางปุ่ม.innerHTML = '<button id="ปุ่มปิดเคส" class="btn btn-ok">ปิดเคส</button>';
      document.getElementById("ปุ่มปิดเคส").addEventListener("click", ประมวลเปลี่ยนสถานะ);
    } else if (alert.status === "ปิดเคส") {
      ที่วางปุ่ม.innerHTML = '<p style="color: var(--muted); font-size: 14px;">เคสนี้ปิดแล้ว</p>';
    }

    // ปุ่มลบถ้าเป็น admin และสถานะ รอรับทราบ
    if (isAdmin(user.role) && alert.status === "รอรับทราบ") {
      const html = ที่วางปุ่ม.innerHTML || '';
      ที่วางปุ่ม.innerHTML = html + '<button id="ปุ่มลบ" class="btn btn-danger">ลบแจ้งเตือน</button>';
      document.getElementById("ปุ่มลบ").addEventListener("click", ประมวลลบ);
    }
  }
}

async function ประมวลเปลี่ยนสถานะ() {
  const ปุ่ม = event.target;
  const ข้อความเดิม = ปุ่ม.textContent;

  try {
    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลัง…";

    const สถานะถัดไป = NEXT_STATUS[alert.status];
    if (!สถานะถัดไป) {
      throw new Error("ไม่สามารถเปลี่ยนสถานะจากตำแหน่งนี้ได้");
    }

    await setStatus(alertId, สถานะถัดไป);
    alert.status = สถานะถัดไป;
    แสดงรายละเอียด();
  } catch (err) {
    console.error(err);
    window.alert("⚠️ " + esc(err.message));
  } finally {
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = ข้อความเดิม;
  }
}

async function ประมวลลบ() {
  if (!confirm("ยืนยันลบแจ้งเตือนนี้? ลบแล้วกู้คืนไม่ได้")) {
    return;
  }

  const ปุ่ม = event.target;
  const ข้อความเดิม = ปุ่ม.textContent;

  try {
    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลัง…";

    await deleteAlert(alertId);
    location.href = "alerts.html";
  } catch (err) {
    console.error(err);
    window.alert("⚠️ " + esc(err.message));
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = ข้อความเดิม;
  }
}

async function โหลดบันทึก() {
  try {
    const responses = await listResponses(alertId);

    if (responses.length === 0) {
      รายการบันทึก.innerHTML = '<p style="color: var(--muted);">ยังไม่มีบันทึก</p>';
      return;
    }

    let html = '';
    // responses มาจากเก่าไปใหม่ ให้พลิกกลับเป็นใหม่ไปเก่า
    for (let i = responses.length - 1; i >= 0; i--) {
      const r = responses[i];
      html += '<div class="response">' +
        '<div class="response-meta">' + esc(r.authorName) + ' · ' + esc(r.createdAt) + '</div>' +
        '<div class="response-text">' + esc(r.message) + '</div>' +
        '</div>';
    }

    รายการบันทึก.innerHTML = html;
  } catch (err) {
    console.error(err);
    รายการบันทึก.innerHTML = '<p class="error">⚠️ ' + esc(err.message) + '</p>';
  }
}

ปุ่มส่งบันทึก.addEventListener("click", async function () {
  const ข้อความ = ข้อความบันทึก.value.trim();

  if (!ข้อความ) {
    เตือนบันทึก.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งบันทึกได้";
    เตือนบันทึก.classList.remove("hidden");
    return;
  }

  เตือนบันทึก.classList.add("hidden");

  const ปุ่ม = ปุ่มส่งบันทึก;
  const ข้อความเดิม = ปุ่ม.textContent;

  try {
    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลัง…";

    await addResponse(alertId, user, ข้อความ);
    ข้อความบันทึก.value = "";
    โหลดบันทึก();
  } catch (err) {
    console.error(err);
    เตือนบันทึก.textContent = "⚠️ " + esc(err.message);
    เตือนบันทึก.classList.remove("hidden");
  } finally {
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = ข้อความเดิม;
  }
});
