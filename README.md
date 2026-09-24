# 🛡️ Playground Intelligence — Zone Alert (Module 2)

🌐 **เว็บออนไลน์:** https://zone-alert-pi-m2.web.app · ต้องสมัครสมาชิกหรือล็อกอินก่อนจึงจะเห็นข้อมูล
🧪 **รายงานผลการทดสอบ:** [`test-results.md`](test-results.md) — ผ่าน 5 / 5 บนเว็บออนไลน์ รวมเทสต์ความปลอดภัย 2 ตัว
📝 **ส่งต่อ Module 3:** [`BACKLOG.md`](BACKLOG.md)

**ผู้จัดทำ:** ธนาวรรธน์ กิตติศรญเกียรติ · **ADT-RAISE Non-Degree Batch 2 · Module 2: MVP-Ready** (สัปดาห์ที่ 6–9) · การบ้านที่ 1–4

---

repo นี้คือการบ้านของ Module 2 ทำกับหัวข้อ Capstone ของผู้จัดทำเอง คือ **Playground Intelligence**
ระบบ AI วิเคราะห์ภาพจากกล้อง CCTV เดิมของโรงเรียน แล้วแจ้งเตือนครูเวรเมื่อเกิดเหตุในโซนที่รับผิดชอบ
Module 2 ทำเฉพาะส่วน **Zone Alert** — ผู้ดูแลระบบสร้างแจ้งเตือน (แทนระบบ AI ในช่วงนี้) → ครูเวรกด **รับทราบ** → **ปิดเคส** พร้อมบันทึกการตอบสนอง

- ใบสั่งงานของระบบ ดู [`spec.md`](spec.md) · ส่วนที่เลือกทำ ดู [`SCOPE.md`](SCOPE.md) · โครงสร้างข้อมูล ดู [`DATA-STRUCTURE.md`](DATA-STRUCTURE.md)
- คู่มือประจำโครงงานสำหรับ Claude Code ดู [`CLAUDE.md`](CLAUDE.md)

> 📌 ระบบจริงของ Playground Intelligence ใช้ Supabase และเก็บข้อมูลกล้องของโรงเรียน จึงแยก repo และโปรเจกต์ Firebase (`zone-alert-pi-m2`) ไว้ต่างหากสำหรับฝึกตามหลักสูตร
> ข้อมูลทุกชิ้นใน repo และฐานข้อมูลนี้เป็น **ข้อมูลสมมติ** ไม่มีชื่อครูหรือนักเรียนจริง

## 🤖 ผู้ช่วย 3 ตัว + ผู้ทดสอบ (`.claude/agents/`)

ระบบสร้างจาก `spec.md` ในรอบเดียว โดยแบ่งงานให้ผู้ช่วยตามชนิดงาน แล้วเลือกโมเดลให้พอดีกับงานเพื่อไม่ให้เปลืองโทเคน

| ผู้ช่วย | โมเดล | ทำอะไร | ทำไมใช้โมเดลนี้ |
|---|---|---|---|
| [`ui-builder`](.claude/agents/ui-builder.md) | **haiku** | หน้าจอ 6 หน้า + สคริปต์ประจำหน้า | งานทำตามแบบหน้าตาเดิม ใช้ตัวเล็กก็จบ |
| [`data-auth`](.claude/agents/data-auth.md) | **sonnet** | Firestore · ล็อกอิน · Security Rules | ต้องคิดเรื่องข้อมูลและความปลอดภัย |
| [`ai-feature`](.claude/agents/ai-feature.md) | **sonnet** | ปุ่ม AI เสนอประเภทเหตุการณ์จากรายละเอียด | ต้องคิดเรื่องผลลัพธ์ของ AI และกรณีผิดพลาด |
| [`tester`](.claude/agents/tester.md) | **sonnet** | ทดสอบด้วย Playwright | ห้ามแก้โค้ดเพื่อให้เทสต์ผ่าน |

ทุกตัวมีข้อกำกับ **ห้ามทำงานนอกสเปค**

## 📁 ในโฟลเดอร์นี้มีอะไร

```
index.html · login.html                 หน้าแรก · เข้าสู่ระบบ/สมัครสมาชิก
alerts.html · new-alert.html            รายการแจ้งเตือน · สร้างแจ้งเตือน (+ ปุ่ม AI)
alert-detail.html · alert-patterns.html รายละเอียด + ปุ่มรับทราบ/ปิดเคส + บันทึก · จัดการประเภทเหตุการณ์
css/style.css                           หน้าตา (สีจาก design system ของโครงงาน)
js/firebase.js · auth.js · data.js      เชื่อม Firebase · ล็อกอิน · อ่านเขียน Firestore
js/ai.js                                ปุ่ม AI ผ่าน OpenRouter
firestore.rules                         กฎเฝ้าข้อมูล
tests/                                  ชุดทดสอบ Playwright 5 ตัว + สคริปต์เตรียมข้อมูล
```

## ▶️ เปิดในเครื่อง

```
npm install
# สร้าง js/firebase-config.js จาก js/firebase-config.example.js
# (ถ้าจะใช้ปุ่ม AI) สร้าง js/config.js จาก js/config.example.js แล้วใส่คีย์ OpenRouter
npm run dev                 # เปิด http://localhost:3001
```

## 🧪 รันเทสต์

```
npm run setup-test-data     # ครั้งแรกครั้งเดียว — บัญชีทดสอบ 3 บัญชี + ข้อมูลตัวอย่าง 5 รายการ
npm test                    # เทสต์ 5 ตัวกับเว็บในเครื่อง
npm run test:online         # เทสต์ 5 ตัวกับเว็บออนไลน์
```

> 🔑 `js/config.js` (คีย์ AI) · `js/firebase-config.js` · `.firebaserc` · `.env.test` (รหัสผ่านบัญชีทดสอบ) อยู่ในเครื่องเท่านั้น `.gitignore` กันไว้
> ปุ่ม AI ใช้ได้เฉพาะตอนเปิดในเครื่อง เพราะไม่ให้คีย์ขึ้นเว็บออนไลน์ — ดูเหตุผลใน [`BACKLOG.md`](BACKLOG.md)

## ✅ ความคืบหน้าการบ้าน

| การบ้าน | งาน | สถานะ |
|---|---|---|
| 1 (สัปดาห์ที่ 6) | repo · `SCOPE.md` · โครงสร้างข้อมูล · Firestore + ข้อมูลตัวอย่าง · หน้ารายการอ่านจากฐานจริง | ✅ |
| 2–3 (สัปดาห์ที่ 7–8) | CRUD · ล็อกอิน · Security Rules รายห้อง · Hosting · ปุ่ม AI | ✅ สร้างรวมในรอบสั่งทีเดียวจบ |
| 4 (สัปดาห์ที่ 9) | `spec.md` · ผู้ช่วย 3 ตัว · เทสต์ 5 ตัวผ่าน · `test-results.md` · `BACKLOG.md` | ✅ |
