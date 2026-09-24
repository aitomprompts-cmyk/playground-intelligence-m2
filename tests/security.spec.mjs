// ─────────────────────────────────────────────────────────────
// tests/security.spec.mjs — "เข้าไม่ได้ = ผ่าน" (ZA-08 + Security Rules)
// ทุกเทสต์ในไฟล์นี้ต้องยิงถาม Firestore ตรงผ่าน REST ด้วย ไม่ใช่ดูแค่หน้าจอ
// ─────────────────────────────────────────────────────────────
import { test, expect } from "@playwright/test";
import { login, pageUrl } from "./helpers/ui.mjs";
import { account, signInAs, firestore, runQuery, createAlertAs, nowText } from "./helpers/firebase-rest.mjs";

test.describe("เข้าไม่ได้ = ผ่าน", () => {
  test("ไม่ล็อกอินแล้วเปิดหน้ารายการ ต้องอ่านข้อมูลไม่ได้", async ({ page }) => {
    await test.step("เปิดหน้ารายการโดยไม่ล็อกอิน ต้องถูกพาไปหน้า login และไม่เห็นแถวแจ้งเตือนใด ๆ", async () => {
      await page.goto("alerts.html");
      await page.waitForURL(pageUrl("login"));
      expect(await page.locator("tr.clickable").count()).toBe(0);
    });

    await test.step("ยิง Firestore ตรงโดยไม่มี token: runQuery ทั้งโฟลเดอร์ alerts ต้องถูกปฏิเสธ (403)", async () => {
      const res = await runQuery(null, "alerts");
      expect(res.status).toBe(403);
    });

    await test.step("ยิง Firestore ตรงโดยไม่มี token: เปิดเอกสารที่รู้ id ตรง ๆ (al004) ต้องถูกปฏิเสธ (403)", async () => {
      const res = await firestore(null, "GET", "alerts/al004");
      expect(res.status).toBe(403);
    });

    await test.step("ยิง Firestore ตรงโดยไม่มี token: อ่านโฟลเดอร์ย่อย responses ของ al001 ต้องถูกปฏิเสธ (403)", async () => {
      const res = await firestore(null, "GET", "alerts/al001/responses");
      expect(res.status).toBe(403);
    });
  });

  test("ครูเวรคนที่สองเปิดแจ้งเตือนของครูเวรคนแรกไม่ได้", async ({ page }) => {
    const title = `[เทสต์] ความปลอดภัย ${Date.now()}`;
    let alertId;

    await test.step("เตรียมข้อมูล: ผู้ดูแลระบบสร้างแจ้งเตือนให้ครูเวรคนแรกผ่าน Firestore ตรง (REST)", async () => {
      const admin = await signInAs("admin");
      const teacher1Session = await signInAs("teacher1");
      const teacher1 = account("teacher1");

      alertId = await createAlertAs(admin, {
        title,
        description: `เทสต์อัตโนมัติ: ความปลอดภัย ${Date.now()}`,
        zoneName: "โซนทดสอบ 4",
        teacherId: teacher1Session.uid,
        teacherName: teacher1.name,
        patternId: "pt001",
        patternName: "เข้าพื้นที่ต้องห้าม",
        createdAt: nowText()
      });
    });

    await test.step("ครูเวรคนที่สองล็อกอินผ่านหน้าเว็บ แล้วเปิดหน้ารายละเอียดของแจ้งเตือนนั้นตรง ๆ ด้วยลิงก์", async () => {
      await login(page, "teacher2");
      await page.goto(`alert-detail.html?id=${alertId}`);
      await expect(page.locator("#กล่องแจ้งเตือน")).not.toContainText(title);
      await expect(page.locator("#ปุ่มรับทราบ")).toHaveCount(0);
      await expect(page.locator("#ปุ่มปิดเคส")).toHaveCount(0);
      await expect(page.locator("#กล่องแจ้งเตือน")).toContainText("⚠️");
    });

    await test.step("หน้ารายการของครูเวรคนที่สอง ต้องไม่มีหัวข้อของแจ้งเตือนครูเวรคนแรกปนอยู่", async () => {
      await page.goto("alerts.html");
      await expect(page.locator("#ผลลัพธ์")).not.toContainText(title);
    });

    await test.step("ยิง Firestore ตรงด้วย token ของครูเวรคนที่สอง: เปิดเอกสารนั้นตรง ๆ และ query ทั้งโฟลเดอร์ alerts ต้องถูกปฏิเสธ (403) ทั้งคู่", async () => {
      const teacher2 = await signInAs("teacher2");

      const resGet = await firestore(teacher2.idToken, "GET", `alerts/${alertId}`);
      expect(resGet.status).toBe(403);

      const resQuery = await runQuery(teacher2.idToken, "alerts");
      expect(resQuery.status).toBe(403);
    });

    await test.step("ยิง Firestore ตรงด้วย token ของครูเวรคนที่สอง: อ่านโฟลเดอร์ย่อย responses ของแจ้งเตือนนั้น ต้องถูกปฏิเสธ (403)", async () => {
      const teacher2 = await signInAs("teacher2");
      const res = await firestore(teacher2.idToken, "GET", `alerts/${alertId}/responses`);
      expect(res.status).toBe(403);
    });

    await test.step("ยิง Firestore ตรงด้วย token ของครูเวรคนที่สอง: แก้ status ของแจ้งเตือนคนอื่น ต้องถูกปฏิเสธ (403)", async () => {
      const teacher2 = await signInAs("teacher2");
      const res = await firestore(
        teacher2.idToken,
        "PATCH",
        `alerts/${alertId}?updateMask.fieldPaths=status`,
        { status: "รับทราบแล้ว" }
      );
      expect(res.status).toBe(403);
    });
  });
});
