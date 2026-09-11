# 🛡️ Playground Intelligence — Zone Alert (Module 2)

**ผู้จัดทำ:** ธนาวรรธน์ กิตติศรญเกียรติ

**ADT-RAISE Non-Degree Batch 2 · Module 2: MVP-Ready** (สัปดาห์ที่ 6–9)

repo นี้คือ **การบ้านที่ 1–4 ของ Module 2** ทำกับหัวข้อ Capstone ของผู้จัดทำเอง คือ Playground Intelligence
ระบบ AI วิเคราะห์ภาพจากกล้อง CCTV เดิมของโรงเรียน แล้วแจ้งเตือนครูเวรเมื่อเกิดเหตุในโซนที่รับผิดชอบ

- ส่วนที่เลือกทำ ดู [`SCOPE.md`](SCOPE.md)
- โครงสร้างข้อมูล Firestore ดู [`DATA-STRUCTURE.md`](DATA-STRUCTURE.md)
- ของที่อยากทำแต่เกินขอบเขต ดู [`BACKLOG.md`](BACKLOG.md)

> 📌 ระบบจริงของ Playground Intelligence ใช้ Supabase และเก็บข้อมูลกล้องของโรงเรียน จึงแยก repo นี้ไว้ต่างหากสำหรับฝึก Firestore ตามหลักสูตร
> ข้อมูลทุกชิ้นใน repo และฐานข้อมูลนี้เป็น **ข้อมูลสมมติ** ไม่มีชื่อครูหรือนักเรียนจริง

---

## 📁 ในโฟลเดอร์นี้มีอะไร

```
index.html              หน้าแรก
alerts.html             รายการแจ้งเตือน · อ่านจาก Firestore จริง เรียงใหม่ไปเก่า
css/style.css           หน้าตา (สีจาก design system ของโครงงาน)
js/firebase-config.js   ค่าเชื่อมต่อ Firebase
js/data.js              ฟังก์ชันอ่านข้อมูลจาก Firestore
js/alerts.js            วาดตารางหน้ารายการแจ้งเตือน
js/nav.js · js/util.js  เมนูด้านบน และตัวช่วยเล็ก ๆ
scripts/seed.mjs        สคริปต์ใส่ข้อมูลตัวอย่างลง Firestore
docs/                   ภาพหน้า Firebase Console (หลักฐานส่งการบ้าน)
```

## ▶️ เปิดดูในเครื่อง

```
npm install
npm run dev
```

แล้วเปิด http://localhost:3001

## 🗄️ ตั้งค่า Firestore (ทำครั้งเดียว)

1. เข้า [Firebase Console](https://console.firebase.google.com) → สร้างโปรเจกต์
2. เมนู **Firestore Database** → **Create database** → **Test mode** → ที่ตั้ง `asia-southeast1`
3. ⚙️ **Project settings** → **Your apps** → ไอคอน `</>` → คัดลอกกล่อง `firebaseConfig`
4. วางค่าแทนข้อความ `วางค่า-...-ที่นี่` ในไฟล์ `js/firebase-config.js`
5. ใส่ข้อมูลตัวอย่าง: `npm run seed`
6. เปิดหน้ารายการแจ้งเตือน ต้องเห็น 5 แถว

⚠️ Test mode เปิดให้ใครก็อ่านเขียนได้ และหมดอายุใน 30 วัน สัปดาห์ที่ 7–8 จะปิดด้วย Security Rules

## ✅ ความคืบหน้าการบ้าน

| สัปดาห์ | งาน | สถานะ |
|---|---|---|
| 6 | ส่วน A · repo บน GitHub + commit ในชื่อผู้จัดทำ | ✅ |
| 6 | ส่วน 0 · `SCOPE.md` | ✅ |
| 6 | ส่วน B · โครงสร้างข้อมูล (ร่างใน `DATA-STRUCTURE.md` แล้วลอกลงกระดาษ) | ✅ |
| 6 | ส่วน C · Firestore + ข้อมูลตัวอย่าง 5 รายการ | ⏳ รอสร้างโปรเจกต์ Firebase |
| 6 | ส่วน D · หน้ารายการอ่านจาก Firestore | ✅ โค้ดพร้อม · ⏳ รอ firebaseConfig |
| 6 | ภาพ Firebase Console ใน `docs/` | ⏳ |
