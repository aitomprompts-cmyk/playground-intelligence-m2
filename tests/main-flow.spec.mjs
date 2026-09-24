// ─────────────────────────────────────────────────────────────
// tests/main-flow.spec.mjs — เส้นทางหลัก: สร้างแจ้งเตือน + เปลี่ยนสถานะ (ZA-01, ZA-02, ZA-03, ZA-04)
// ─────────────────────────────────────────────────────────────
import { test, expect } from "@playwright/test";
import { login, findRow, pageUrl } from "./helpers/ui.mjs";
import { account, signInAs, createAlertAs, nowText } from "./helpers/firebase-rest.mjs";

test("ผู้ดูแลระบบสร้างแจ้งเตือน แล้วครูเวรเห็นในรายการ", async ({ page, browser }) => {
  const title = `[เทสต์] สร้างแจ้งเตือน ${Date.now()}`;
  const teacher1 = account("teacher1");

  await test.step("ผู้ดูแลระบบล็อกอิน แล้วเปิดหน้าสร้างแจ้งเตือน", async () => {
    await login(page, "admin");
    await page.goto("new-alert.html");
  });

  await test.step("กรอกฟอร์มให้ครบ เลือกครูเวรเป็นครูเวรคนแรก แล้วกดบันทึก", async () => {
    await page.fill("#title", title);
    await page.fill("#description", `เทสต์อัตโนมัติ: สร้างแจ้งเตือน ${Date.now()}`);
    await page.fill("#zoneName", "โซนทดสอบ 1");
    await page.selectOption("#patternId", { index: 1 });
    await page.selectOption("#teacherId", { label: teacher1.name });
    await page.click("#ปุ่มบันทึก");
  });

  let row;
  await test.step("ต้องกลับมาหน้ารายการ และเห็นแถวแจ้งเตือนที่เพิ่งสร้าง", async () => {
    await expect(page).toHaveURL(pageUrl("alerts"));
    row = findRow(page, title);
    await expect(row).toBeVisible();
  });

  await test.step("รีเฟรชหน้า แล้วแถวยังต้องอยู่ (ข้อมูลอ่านจาก Firestore จริง)", async () => {
    await page.reload();
    row = findRow(page, title);
    await expect(row).toBeVisible();
  });

  const teacherContext = await browser.newContext();
  const teacherPage = await teacherContext.newPage();

  await test.step("ครูเวรคนแรกล็อกอินในเบราว์เซอร์ใหม่ เห็นแจ้งเตือนในรายการ แล้วกดเข้าไปดู", async () => {
    await login(teacherPage, "teacher1");
    const teacherRow = findRow(teacherPage, title);
    await expect(teacherRow).toBeVisible();
    await teacherRow.click();
    await expect(teacherPage).toHaveURL(pageUrl("alert-detail"));
    await expect(teacherPage.locator("#กล่องแจ้งเตือน")).toContainText(title);
    await expect(teacherPage.locator("#กล่องแจ้งเตือน .badge")).toHaveText("รอรับทราบ");
  });

  await teacherContext.close();
});

test("ครูเวรกดรับทราบ แล้วกดปิดเคส สถานะเปลี่ยนตามลำดับ", async ({ page }) => {
  const title = `[เทสต์] เปลี่ยนสถานะ ${Date.now()}`;
  const teacher1 = account("teacher1");
  let alertId;

  await test.step("เตรียมข้อมูล: ผู้ดูแลระบบสร้างแจ้งเตือนให้ครูเวรคนแรกผ่าน Firestore ตรง (REST)", async () => {
    const admin = await signInAs("admin");
    const teacherSession = await signInAs("teacher1");

    alertId = await createAlertAs(admin, {
      title,
      description: `เทสต์อัตโนมัติ: เปลี่ยนสถานะ ${Date.now()}`,
      zoneName: "โซนทดสอบ 2",
      teacherId: teacherSession.uid,
      teacherName: teacher1.name,
      patternId: "pt001",
      patternName: "เข้าพื้นที่ต้องห้าม",
      createdAt: nowText()
    });
  });

  await test.step("ครูเวรคนแรกล็อกอิน แล้วเปิดหน้ารายละเอียดของแจ้งเตือนนี้ตรง ๆ", async () => {
    await login(page, "teacher1");
    await page.goto(`alert-detail.html?id=${alertId}`);
    await expect(page.locator("#กล่องแจ้งเตือน")).toContainText(title);
    await expect(page.locator("#กล่องแจ้งเตือน .badge")).toHaveText("รอรับทราบ");
  });

  await test.step("สถานะ รอรับทราบ ต้องมีปุ่มรับทราบ และยังไม่มีปุ่มปิดเคส", async () => {
    await expect(page.locator("#ปุ่มรับทราบ")).toBeVisible();
    await expect(page.locator("#ปุ่มปิดเคส")).toHaveCount(0);
  });

  await test.step("กดรับทราบ แล้วป้ายสถานะต้องเปลี่ยนเป็น รับทราบแล้ว", async () => {
    await page.click("#ปุ่มรับทราบ");
    await expect(page.locator("#กล่องแจ้งเตือน .badge")).toHaveText("รับทราบแล้ว");
  });

  await test.step("รีเฟรชหน้า แล้วยังเป็น รับทราบแล้ว และตอนนี้มีปุ่มปิดเคสแล้ว", async () => {
    await page.reload();
    await expect(page.locator("#กล่องแจ้งเตือน .badge")).toHaveText("รับทราบแล้ว");
    await expect(page.locator("#ปุ่มปิดเคส")).toBeVisible();
  });

  await test.step("กดปิดเคส แล้วป้ายสถานะต้องเปลี่ยนเป็น ปิดเคส", async () => {
    await page.click("#ปุ่มปิดเคส");
    await expect(page.locator("#กล่องแจ้งเตือน .badge")).toHaveText("ปิดเคส");
  });

  await test.step("รีเฟรชหน้า แล้วยังเป็น ปิดเคส และไม่มีปุ่มเปลี่ยนสถานะเหลืออยู่", async () => {
    await page.reload();
    await expect(page.locator("#กล่องแจ้งเตือน .badge")).toHaveText("ปิดเคส");
    await expect(page.locator("#ปุ่มรับทราบ")).toHaveCount(0);
    await expect(page.locator("#ปุ่มปิดเคส")).toHaveCount(0);
  });
});
