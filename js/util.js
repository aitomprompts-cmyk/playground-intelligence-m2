// ─────────────────────────────────────────────────────────────
// js/util.js — ตัวช่วยเล็ก ๆ ที่ทุกหน้าเรียกใช้
// ─────────────────────────────────────────────────────────────

// แปลงข้อความให้ปลอดภัยก่อนวางในหน้าเว็บ กันเครื่องหมาย < > ทำหน้าเพี้ยน
function esc(ข้อความ) {
  return String(ข้อความ == null ? "" : ข้อความ)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// อ่านค่า query parameter จาก URL เช่น ?id=abc ได้ getQueryParam("id") = "abc"
function getQueryParam(ชื่อ) {
  return new URLSearchParams(location.search).get(ชื่อ) || "";
}

// ป้ายสถานะสี — รอรับทราบ=เหลือง รับทราบแล้ว=ฟ้า ปิดเคส=เขียว
var ชนิดป้ายสถานะ = {
  "รอรับทราบ": "pending",
  "รับทราบแล้ว": "ack",
  "ปิดเคส": "resolved"
};

function ป้ายสถานะ(สถานะ) {
  var ชนิด = ชนิดป้ายสถานะ[สถานะ] || "unknown";
  return '<span class="badge badge-' + ชนิด + '">' + esc(สถานะ) + "</span>";
}
