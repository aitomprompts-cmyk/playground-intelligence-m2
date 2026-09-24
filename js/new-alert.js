// ─────────────────────────────────────────────────────────────
// js/new-alert.js — หน้าสร้างแจ้งเตือน
// ─────────────────────────────────────────────────────────────

import { requireLogin, isAdmin } from "./auth.js";
import { createAlert, listPatterns, listTeachers } from "./data.js";
import { suggestPattern } from "./ai.js";

const ฟอร์ม = document.getElementById("ฟอร์มแจ้งเตือน");
const ฟอร์มการ์ด = document.getElementById("ฟอร์มการ์ด");
const กล่องเตือน = document.getElementById("ข้อความเตือน");
const ปุ่มAI = document.getElementById("ปุ่มAI");
const ผลAI = document.getElementById("ผลAI");

let user = null;
let patterns = [];
let teachers = [];

// โหลดข้อมูล
try {
  user = await requireLogin();

  // ตรวจสอบว่าเป็น admin หรือไม่
  if (!isAdmin(user.role)) {
    ฟอร์มการ์ด.innerHTML = '<div class="alert alert-warn">⚠️ หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</div>';
    ฟอร์ม.style.display = "none";
  } else {
    // โหลดรายการประเภทและครูเวร
    patterns = await listPatterns();
    teachers = await listTeachers();

    // เติมลำดับขั้นประเภท
    const selectPattern = document.getElementById("patternId");
    patterns.forEach(function (p) {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.name;
      selectPattern.appendChild(option);
    });

    // เติมลำดับขั้นครูเวร
    const selectTeacher = document.getElementById("teacherId");
    teachers.forEach(function (t) {
      const option = document.createElement("option");
      option.value = t.id;
      option.textContent = t.name;
      selectTeacher.appendChild(option);
    });
  }
} catch (err) {
  console.error(err);
  กล่องเตือน.textContent = "⚠️ " + esc(err.message);
  กล่องเตือน.classList.remove("hidden");
  ฟอร์ม.style.display = "none";
}

// ให้ AI เสนอประเภท
ปุ่มAI.addEventListener("click", async function () {
  const description = document.getElementById("description").value.trim();

  if (!description) {
    ผลAI.textContent = "⚠️ พิมพ์รายละเอียดเหตุการณ์ก่อน";
    ผลAI.classList.remove("hidden");
    return;
  }

  ปุ่มAI.disabled = true;
  ปุ่มAI.textContent = "กำลังให้ AI คิด…";
  ผลAI.textContent = "";
  ผลAI.classList.add("hidden");

  try {
    const ผล = await suggestPattern(description, patterns);
    if (ผล.ok) {
      document.getElementById("patternId").value = ผล.pattern.id;
      ผลAI.innerHTML = "✓ ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน: <strong>" + esc(ผล.pattern.name) + "</strong>";
      ผลAI.classList.remove("hidden");
    } else {
      ผลAI.textContent = "⚠️ " + esc(ผล.message);
      ผลAI.classList.remove("hidden");
    }
  } catch (err) {
    ผลAI.textContent = "⚠️ เกิดข้อผิดพลาด — " + esc(err.message);
    ผลAI.classList.remove("hidden");
  } finally {
    ปุ่มAI.disabled = false;
    ปุ่มAI.textContent = "🤖 ให้ AI ช่วยเสนอประเภทเหตุการณ์";
  }
});

// ส่งฟอร์ม
ฟอร์ม.addEventListener("submit", async function (e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const zoneName = document.getElementById("zoneName").value.trim();
  const patternId = document.getElementById("patternId").value.trim();
  const teacherId = document.getElementById("teacherId").value.trim();

  // ตรวจสอบว่าครบ
  const ช่องว่าง = [];
  if (!title) ช่องว่าง.push("หัวข้อเหตุการณ์");
  if (!description) ช่องว่าง.push("รายละเอียด");
  if (!zoneName) ช่องว่าง.push("โซน");
  if (!patternId) ช่องว่าง.push("ประเภทเหตุการณ์");
  if (!teacherId) ช่องว่าง.push("ครูเวรที่รับผิดชอบ");

  if (ช่องว่าง.length > 0) {
    กล่องเตือน.textContent = "⚠️ ต้องกรอก: " + ช่องว่าง.join(", ");
    กล่องเตือน.classList.remove("hidden");
    return;
  }

  // ค้นหาชื่อประเภทและครูเวร
  const pattern = patterns.find(function (p) { return p.id === patternId; });
  const teacher = teachers.find(function (t) { return t.id === teacherId; });

  const ปุ่ม = document.getElementById("ปุ่มบันทึก");
  const ข้อความเดิม = ปุ่ม.textContent;

  try {
    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลังบันทึก…";
    กล่องเตือน.classList.add("hidden");

    await createAlert({
      title,
      description,
      zoneName,
      patternId,
      patternName: pattern.name,
      teacherId,
      teacherName: teacher.name
    });

    location.href = "alerts.html";
  } catch (err) {
    console.error(err);
    กล่องเตือน.textContent = "⚠️ " + esc(err.message);
    กล่องเตือน.classList.remove("hidden");
  } finally {
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = ข้อความเดิม;
  }
});

// ปุ่มบันทึกเริ่มแบบกดไม่ได้ในหน้า HTML — เปิดเมื่อโหลดประเภทและรายชื่อครูเวรเสร็จ และผูกการส่งฟอร์มแล้ว
// (กันกดก่อนโค้ดพร้อม แล้วเบราว์เซอร์ส่งฟอร์มเองจนหน้าโหลดใหม่)
document.getElementById("ปุ่มบันทึก").disabled = false;
