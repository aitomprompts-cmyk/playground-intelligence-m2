// ─────────────────────────────────────────────────────────────
// js/nav.js — แถบเมนูด้านบนที่ใช้ร่วมกันทุกหน้า
// ทุกหน้ามี <div id="nav"></div> ไว้บนสุดของ body
// ─────────────────────────────────────────────────────────────

(function () {
  var เมนู = [
    { href: "index.html",  ชื่อ: "หน้าแรก" },
    { href: "alerts.html", ชื่อ: "รายการแจ้งเตือน" }
  ];

  var หน้าปัจจุบัน = location.pathname.split("/").pop() || "index.html";

  var html = '<nav class="navbar"><span class="brand">🛡️ Playground Intelligence</span>';
  เมนู.forEach(function (m) {
    var active = m.href === หน้าปัจจุบัน ? ' class="active"' : "";
    html += '<a href="' + m.href + '"' + active + ">" + m.ชื่อ + "</a>";
  });
  html += "</nav>";

  var ที่วาง = document.getElementById("nav");
  if (ที่วาง) ที่วาง.innerHTML = html;
})();

// แถบเตือนสีเหลือง ใช้ตอนที่ยังไม่ได้วางค่า firebaseConfig
function showConfigWarning() {
  var กล่อง = document.createElement("div");
  กล่อง.className = "alert alert-warn";
  กล่อง.innerHTML =
    "⚠️ <strong>ยังไม่ได้ตั้งค่า Firebase</strong> — หน้านี้จึงยังไม่ได้อ่านข้อมูลจากฐานข้อมูลจริง" +
    "<br>วางค่า firebaseConfig ในไฟล์ js/firebase-config.js ตามขั้นตอนใน README.md";
  var ที่วาง = document.querySelector(".container") || document.body;
  ที่วาง.insertBefore(กล่อง, ที่วาง.firstChild);
}
