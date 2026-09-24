// ─────────────────────────────────────────────────────────────
// tests/helpers/ui.mjs — ตัวช่วยของเทสต์ฝั่งหน้าเว็บ (กดแทนคนจริงผ่าน Playwright)
// ใช้ตัวระบุบนหน้าจอตาม CLAUDE.md หัวข้อ 3 เท่านั้น ห้ามเดา selector เอง
// ─────────────────────────────────────────────────────────────
import { expect } from "@playwright/test";
import { account } from "./firebase-rest.mjs";

// สร้าง regex จับ URL ของหน้าชื่อนี้ ไม่ว่าจะมีหรือไม่มีนามสกุล .html ต่อท้าย
// (เซิร์ฟเวอร์ในเครื่อง `serve` อาจตัด .html ออกให้อัตโนมัติ — URL บนจอจึงกลายเป็น /ชื่อหน้า
// ล้วน ๆ ส่วนเว็บออนไลน์ตั้ง cleanUrls: false ไว้ จึงยังคง .html — เทสต์ต้องรับได้ทั้งสองแบบ)
export function pageUrl(name) {
  return new RegExp(`/${name}(\\.html)?(\\?.*)?$`);
}

// ล็อกอินผ่านหน้าเว็บจริงด้วยบัญชีทดสอบ (key = "teacher1" | "teacher2" | "admin")
// คืนข้อมูลบัญชีที่ใช้ (email/name/role) ให้เทสต์เอาไปเทียบต่อได้
export async function login(page, key) {
  const acc = account(key);
  await page.goto("login.html");
  await page.fill("#email", acc.email);
  await page.fill("#password", acc.password);
  await page.click("#ปุ่มเข้าสู่ระบบ");
  await page.waitForURL(pageUrl("alerts"));
  return acc;
}

// กรอกฟอร์มสร้างแจ้งเตือนแล้วกดบันทึก — ต้องอยู่หน้า new-alert.html อยู่แล้ว
// (เรียก page.goto("new-alert.html") เองก่อนหน้านี้ ถ้าต้องการควบคุมจังหวะ)
// teacherLabel = ชื่อที่ขึ้นในตัวเลือก #teacherId ตรง ๆ (ดึงจาก account().name)
export async function fillNewAlertForm(page, { title, description, zoneName, teacherLabel } = {}) {
  if (title !== undefined) await page.fill("#title", title);
  if (description !== undefined) await page.fill("#description", description);
  if (zoneName !== undefined) await page.fill("#zoneName", zoneName);
  // เลือกตัวเลือกจริงตัวแรก (index 0 คือ placeholder "— เลือกประเภทเหตุการณ์ —")
  await page.selectOption("#patternId", { index: 1 });
  if (teacherLabel) await page.selectOption("#teacherId", { label: teacherLabel });
}

// หาแถวในหน้ารายการที่มีหัวข้อ (title) นี้ — คืน locator ให้เทสต์ตรวจต่อ (visible/คลิก/data-id)
export function findRow(page, title) {
  return page.locator("tr.clickable", { hasText: title });
}

export { expect };
