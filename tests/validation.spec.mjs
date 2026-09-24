// ─────────────────────────────────────────────────────────────
// tests/validation.spec.mjs — กรอกฟอร์มไม่ครบต้องไม่บันทึก (ZA-02)
// ─────────────────────────────────────────────────────────────
import { test, expect } from "@playwright/test";
import { login, pageUrl } from "./helpers/ui.mjs";
import { account, signInAs, runQuery } from "./helpers/firebase-rest.mjs";

test("กรอกไม่ครบ (เว้นหัวข้อ) ต้องไม่บันทึกและขึ้นข้อความบอก", async ({ page }) => {
  const marker = `เทสต์-เว้นหัวข้อ-${Date.now()}`;
  const teacher1 = account("teacher1");

  await test.step("ผู้ดูแลระบบล็อกอิน แล้วเปิดหน้าสร้างแจ้งเตือน", async () => {
    await login(page, "admin");
    await page.goto("new-alert.html");
  });

  await test.step("กรอกทุกช่องให้ครบ ยกเว้นหัวข้อ แล้วกดบันทึก", async () => {
    await page.fill("#description", marker);
    await page.fill("#zoneName", "โซนทดสอบ 3");
    await page.selectOption("#patternId", { index: 1 });
    await page.selectOption("#teacherId", { label: teacher1.name });
    await page.click("#ปุ่มบันทึก");
  });

  await test.step("ต้องขึ้นข้อความเตือนที่ไม่ว่างเปล่า และยังอยู่หน้าสร้างแจ้งเตือนเดิม (ไม่ได้พาไปหน้ารายการ)", async () => {
    const เตือน = page.locator("#ข้อความเตือน");
    await expect(เตือน).toBeVisible();
    await expect(เตือน).not.toHaveText("");
    await expect(page).toHaveURL(pageUrl("new-alert"));
  });

  await test.step("ยืนยันตรงกับ Firestore ว่าไม่มีแจ้งเตือนที่มี description นี้ถูกบันทึกจริง", async () => {
    const admin = await signInAs("admin");
    // เผื่อเวลาสั้น ๆ ในกรณีที่หน้าเว็บพยายามบันทึกอยู่เบื้องหลัง (ไม่ควรเกิดขึ้นตามโค้ด แต่เช็กให้ชัวร์)
    await page.waitForTimeout(1500);
    const ผล = await runQuery(admin.idToken, "alerts");
    const พบ = ผล.docs.find((d) => d.description === marker);
    expect(พบ).toBeUndefined();
  });
});
