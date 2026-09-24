// ─────────────────────────────────────────────────────────────
// js/alert-patterns.js — หน้าจัดการประเภทเหตุการณ์
// ─────────────────────────────────────────────────────────────

import { requireLogin, isAdmin } from "./auth.js";
import { listPatterns, addPattern, updatePattern, deletePattern } from "./data.js";

const เตือน = document.getElementById("เตือนประเภท");
const ตาราง = document.getElementById("ตารางประเภท");
const เพิ่มการ์ด = document.getElementById("เพิ่มการ์ด");
const inputชื่อ = document.getElementById("ชื่อประเภทใหม่");
const ปุ่มเพิ่ม = document.getElementById("ปุ่มเพิ่ม");

let user = null;
let patterns = [];

// โหลดข้อมูล
try {
  user = await requireLogin();

  patterns = await listPatterns();
  แสดงตาราง();

  // ซ่อนการแก้ไขถ้าไม่ใช่ admin
  if (!isAdmin(user.role)) {
    เพิ่มการ์ด.style.display = "none";
    เตือน.innerHTML = "⚠️ หน้านี้แก้ไขได้เฉพาะผู้ดูแลระบบ";
    เตือน.classList.remove("hidden");
  }
} catch (err) {
  console.error(err);
  เตือน.textContent = "⚠️ " + esc(err.message);
  เตือน.classList.remove("hidden");
}

function แสดงตาราง() {
  if (patterns.length === 0) {
    ตาราง.innerHTML = "<p>ยังไม่มีประเภทเหตุการณ์</p>";
    return;
  }

  let html = '<div class="table-wrap"><table><thead><tr>' +
    '<th>ชื่อประเภท</th>';

  if (isAdmin(user.role)) {
    html += '<th>การกระทำ</th>';
  }

  html += '</tr></thead><tbody>';

  patterns.forEach(function (p) {
    html += '<tr><td>' + esc(p.name) + '</td>';

    if (isAdmin(user.role)) {
      html += '<td>' +
        '<button class="btn-edit" data-id="' + esc(p.id) + '">แก้ไข</button> ' +
        '<button class="btn-delete" data-id="' + esc(p.id) + '">ลบ</button>' +
        '</td>';
    }

    html += '</tr>';
  });

  html += '</tbody></table></div>';
  ตาราง.innerHTML = html;

  // เติมตัวจัดการปุ่ม
  if (isAdmin(user.role)) {
    ตาราง.querySelectorAll(".btn-edit").forEach(function (btn) {
      btn.addEventListener("click", ประมวลแก้ไข);
    });

    ตาราง.querySelectorAll(".btn-delete").forEach(function (btn) {
      btn.addEventListener("click", ประมวลลบ);
    });
  }
}

async function ประมวลแก้ไข() {
  const id = this.getAttribute("data-id");
  const pattern = patterns.find(p => p.id === id);

  if (!pattern) return;

  const ชื่อใหม่ = prompt("แก้ไขชื่อประเภท:", pattern.name);
  if (!ชื่อใหม่ || ชื่อใหม่.trim() === pattern.name) return;

  const ปุ่ม = this;
  const ข้อความเดิม = ปุ่ม.textContent;

  try {
    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลัง…";

    await updatePattern(id, ชื่อใหม่.trim());

    // อัปเดตรายการในหน่วยความจำ
    const idx = patterns.findIndex(p => p.id === id);
    if (idx >= 0) patterns[idx].name = ชื่อใหม่.trim();

    แสดงตาราง();
  } catch (err) {
    console.error(err);
    alert("⚠️ " + esc(err.message));
  } finally {
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = ข้อความเดิม;
  }
}

async function ประมวลลบ() {
  const id = this.getAttribute("data-id");
  const pattern = patterns.find(p => p.id === id);

  if (!pattern) return;

  if (!confirm("ยืนยันลบ '" + pattern.name + "'? ลบแล้วกู้คืนไม่ได้")) {
    return;
  }

  const ปุ่ม = this;
  const ข้อความเดิม = ปุ่ม.textContent;

  try {
    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลัง…";

    await deletePattern(id);

    // ลบออกจากรายการในหน่วยความจำ
    patterns = patterns.filter(p => p.id !== id);

    แสดงตาราง();
  } catch (err) {
    console.error(err);
    alert("⚠️ " + esc(err.message));
  } finally {
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = ข้อความเดิม;
  }
}

ปุ่มเพิ่ม.addEventListener("click", async function () {
  const ชื่อ = inputชื่อ.value.trim();

  if (!ชื่อ) {
    alert("กรุณากรอกชื่อประเภท");
    return;
  }

  const ปุ่ม = ปุ่มเพิ่ม;
  const ข้อความเดิม = ปุ่ม.textContent;

  try {
    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลัง…";
    เตือน.classList.add("hidden");

    const pattern = await addPattern(ชื่อ);
    patterns.push(pattern);
    inputชื่อ.value = "";

    แสดงตาราง();
  } catch (err) {
    console.error(err);
    เตือน.textContent = "⚠️ " + esc(err.message);
    เตือน.classList.remove("hidden");
  } finally {
    ปุ่ม.disabled = false;
    ปุ่ม.textContent = ข้อความเดิม;
  }
});
