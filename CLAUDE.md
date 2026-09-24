# CLAUDE.md — คู่มือประจำโครงงาน Zone Alert (Playground Intelligence · Module 2)

> Claude Code อ่านไฟล์นี้ทุกครั้งก่อนเริ่มงาน · **ข้อกำหนดตัวจริงอยู่ใน [`spec.md`](spec.md)** — ไฟล์นี้บอกว่าแบ่งงานกันอย่างไร และไฟล์คุยกันผ่านฟังก์ชันอะไร

## 1. ขอบเขต

สร้าง ZA-01 ถึง ZA-09 ตาม `spec.md` · ⛔ ไม่ทำทุกข้อในหัวข้อ 8 ของ `spec.md` · ไม่มี framework · ไม่มีเซิร์ฟเวอร์

## 2. ผู้ช่วย 3 ตัว + ผู้ทดสอบ (`.claude/agents/`)

| ผู้ช่วย | โมเดล | รับผิดชอบไฟล์ |
|---|---|---|
| `ui-builder` | haiku | `*.html` · `css/` · `js/nav.js` · `js/util.js` · สคริปต์ประจำหน้า `js/alerts.js` `js/new-alert.js` `js/alert-detail.js` `js/alert-patterns.js` `js/login.js` |
| `data-auth` | sonnet | `js/firebase.js` · `js/auth.js` · `js/data.js` · `js/firebase-config.example.js` · `firestore.rules` · `firebase.json` |
| `ai-feature` | sonnet | `js/ai.js` · `js/config.example.js` |
| `tester` | sonnet | `tests/` · `playwright.config.js` · `test-results.md` (ห้ามแตะโค้ดระบบ) |

**ห้ามแก้ไฟล์ของผู้ช่วยตัวอื่น** — ต้องการให้เปลี่ยนอะไร ให้รายงานกลับมา

## 3. สัญญาระหว่างไฟล์

ทุกไฟล์ใน `js/` ยกเว้น `nav.js` `util.js` เป็น ES module · Firebase SDK เวอร์ชัน 12.18.0 จาก `https://www.gstatic.com/firebasejs/12.18.0/…` (import จาก URL ตรง ไม่ใช้ import map)

**`js/firebase.js`** → `export { app, auth, db }` อ่านค่าจาก `js/firebase-config.js` (`export const firebaseConfig = {...}`)

**`js/auth.js`**
- `requireLogin()` → `Promise<{ uid, name, email, role }>` · รอสถานะล็อกอินก่อน · ไม่ได้ล็อกอินพาไป `login.html` · เติมชื่อ + บทบาท + ปุ่มออกจากระบบ `#ปุ่มออกจากระบบ` ลงใน `#navUser`
- `signUp(name, email, password)` · `signIn(email, password)` · `signOutUser()`
- `isAdmin(role)` · `ROLE_TH` = `{ duty_teacher: "ครูเวร", admin: "ผู้ดูแลระบบ" }` · `expectedRole(email)`

**`js/data.js`** (async ทั้งหมด · ผิดพลาดให้ throw `Error` ข้อความไทยบอกว่าเกิดอะไรและทำอะไรต่อ)
- `listAlerts(user)` → ใหม่ไปเก่าตาม `createdAt` · ครูเวรได้เฉพาะ `teacherId == uid` · admin ได้ทั้งหมด · จำกัด 100
- `getAlert(id)` → แจ้งเตือน หรือ `null` ถ้าไม่พบ · ไม่มีสิทธิ์ให้ throw ข้อความว่าไม่มีสิทธิ์เปิดแจ้งเตือนนี้
- `createAlert({ title, description, zoneName, patternId, patternName, teacherId, teacherName })` → id ใหม่ (`status: "รอรับทราบ"`, `createdAt` อัตโนมัติ)
- `setStatus(id, status)` — แก้เฉพาะช่อง `status`
- `deleteAlert(id)` — ลบบันทึกในโฟลเดอร์ย่อยก่อน แล้วลบแจ้งเตือน
- `listResponses(id)` → เก่าไปใหม่ · `addResponse(id, user, message)`
- `listPatterns()` → เรียงตามชื่อ · `addPattern(name)` · `updatePattern(id, name)` · `deletePattern(id)`
- `listTeachers()` → ผู้ใช้ที่ `role == "duty_teacher"` เรียงตามชื่อ (admin ใช้เลือกครูเวร)
- `NEXT_STATUS` = `{ "รอรับทราบ": "รับทราบแล้ว", "รับทราบแล้ว": "ปิดเคส" }`

**`js/ai.js`** — `suggestPattern(description, patterns)` → `{ ok: true, pattern: {id, name} }` เมื่อ AI ตอบชื่อที่ตรงกับประเภทที่มีอยู่จริง · ไม่เช่นนั้น `{ ok: false, message }` · ห้าม throw · หมดเวลา 15 วินาที · อ่านคีย์จาก `js/config.js` ด้วย dynamic import

**ตัวระบุบนหน้าจอที่เทสต์ใช้ (ห้ามเปลี่ยนชื่อ)**
- ล็อกอิน: `#email` `#password` `#ปุ่มเข้าสู่ระบบ` · สมัคร: `#signupName` `#signupEmail` `#signupPassword` `#ปุ่มสมัคร` · ข้อความผิดพลาด `#ข้อความเตือน`
- รายการ: กล่อง `#ผลลัพธ์` · แถว `tr.clickable[data-id]`
- สร้าง: `#title` `#description` `#zoneName` `#patternId` `#teacherId` `#ปุ่มบันทึก` · ข้อความเตือน `#ข้อความเตือน` · ปุ่ม AI `#ปุ่มAI` · ผล AI `#ผลAI`
- รายละเอียด: กล่อง `#กล่องแจ้งเตือน` · ปุ่ม `#ปุ่มรับทราบ` `#ปุ่มปิดเคส` `#ปุ่มลบ` · ป้ายสถานะ `.badge` · บันทึก `#รายการบันทึก` `#ข้อความบันทึก` `#ปุ่มส่งบันทึก`

## 4. บัญชีทดสอบ (อีเมลสมมติ)

`tester.teacher1@example.com` ครูเวรคนแรก · `tester.teacher2@example.com` ครูเวรคนที่สอง · `tester.admin@example.com` ผู้ดูแลระบบ
บทบาท `admin` กำหนดด้วยรายชื่ออีเมลใน `firestore.rules` (`roleForEmail`) และ `expectedRole()` ใน `js/auth.js` — สองที่ต้องตรงกัน · รหัสผ่านอยู่ใน `.env.test` (ไม่ commit)

## 5. ข้อตกลง

- ข้อความบนหน้าจอและคอมเมนต์เป็นภาษาไทย · ชื่อช่องข้อมูลสะกดตาม `spec.md` หัวข้อ 5 เป๊ะ · สถานะมี 3 ค่า
- ทุกจุดที่รอต้องมีข้อความกำลังโหลด · ข้อความผิดพลาดบอกว่าเกิดอะไรและทำอะไรต่อ · ใช้บนมือถือได้
- ❌ ห้ามใส่คีย์ในไฟล์ที่ commit · ❌ ห้ามใช้ชื่อหรืออีเมลจริงของครูหรือนักเรียน · ❌ ห้ามเปิดกฎให้กว้างเพื่อให้ทดสอบง่าย · ❌ ห้ามแก้โค้ดเพื่อให้เทสต์ผ่าน
- เปิดในเครื่องด้วย `npm run dev` (http://localhost:3001) · `serve.json` ปิด cleanUrls ไว้ ไม่งั้น `?id=` หาย
