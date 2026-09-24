// ─────────────────────────────────────────────────────────
// js/ai.js — ผู้ช่วย AI ของ Zone Alert (ผ่าน OpenRouter)
// ─────────────────────────────────────────────────────────
//
// หน้าที่เดียวเท่านั้น (ตาม ZA-09 ห้ามเพิ่มเติมนอกสเปค):
//   suggestPattern(description, patterns) — เสนอประเภทเหตุการณ์จากข้อความรายละเอียดที่เห็นในกล้อง
//
// กติกาที่ต้องยึดตลอดไฟล์นี้:
//   - ห้าม throw เด็ดขาด ทุกฟังก์ชันคืนค่า { ok: true, ... } หรือ { ok: false, message }
//   - หมดเวลาที่ 15 วินาที
//   - อ่านคีย์จาก js/config.js ด้วย dynamic import เท่านั้น (ไฟล์นี้ไม่ commit — ดู js/config.example.js)
//   - ส่งไปให้ AI เฉพาะข้อความรายละเอียดเหตุการณ์และรายชื่อประเภทเหตุการณ์
//     ห้ามส่งชื่อครู ชื่อนักเรียน อีเมล โซน หรือหัวข้อเหตุการณ์
// ─────────────────────────────────────────────────────────

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash-lite";
const TIMEOUT_MS = 15000;

const ข้อความยังไม่ตั้งค่าคีย์ =
  "ยังไม่ได้ตั้งค่าคีย์ AI — ปุ่มนี้ใช้ได้เมื่อเปิดระบบในเครื่องที่มีไฟล์ js/config.js · เลือกประเภทเองได้ตามปกติ";

// ─────────────────────────────────────────────────────────
// โหลดค่าตั้งค่า AI จาก js/config.js (ไฟล์นี้ไม่ถูก commit — ดู js/config.example.js)
// คืน { ok:false, message } ถ้าไม่มีไฟล์ หรือยังไม่ได้กรอกคีย์จริง
// ─────────────────────────────────────────────────────────
async function โหลดค่าตั้งค่า() {
  try {
    const mod = await import("./config.js");
    const aiConfig = mod && mod.aiConfig;
    const apiKey = aiConfig && aiConfig.apiKey ? String(aiConfig.apiKey).trim() : "";

    if (!apiKey || apiKey.startsWith("ใส่")) {
      return { ok: false, message: ข้อความยังไม่ตั้งค่าคีย์ };
    }

    const model =
      aiConfig && aiConfig.model && String(aiConfig.model).trim()
        ? String(aiConfig.model).trim()
        : DEFAULT_MODEL;

    return { ok: true, apiKey, model };
  } catch {
    // ไม่มีไฟล์ js/config.js เลย หรือ import ล้มเหลวด้วยเหตุใดก็ตาม
    return { ok: false, message: ข้อความยังไม่ตั้งค่าคีย์ };
  }
}

// ─────────────────────────────────────────────────────────
// เรียก OpenRouter แบบ chat completion — ห้าม throw เด็ดขาด
// คืน { ok:true, content } หรือ { ok:false, message }
// ─────────────────────────────────────────────────────────
async function เรียกAI({ apiKey, model, messages, temperature }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": location.origin,
        "X-Title": "Zone Alert",
      },
      body: JSON.stringify({ model, messages, temperature }),
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { ok: false, message: "คีย์ AI ไม่ถูกต้องหรือหมดอายุ — ตรวจสอบไฟล์ js/config.js อีกครั้ง" };
      }
      if (res.status === 402) {
        return { ok: false, message: "บัญชี OpenRouter เครดิตหมด — เติมเครดิตแล้วลองใหม่ หรือเลือกประเภทเองไปก่อน" };
      }
      if (res.status === 429) {
        return { ok: false, message: "เรียก AI ถี่เกินไป (ติดขีดจำกัด) — รอสักครู่แล้วลองใหม่ หรือเลือกประเภทเองไปก่อน" };
      }
      return { ok: false, message: `เรียก AI ไม่สำเร็จ (รหัส ${res.status}) — ลองใหม่อีกครั้ง หรือเลือกประเภทเองไปก่อน` };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || !String(content).trim()) {
      return { ok: false, message: "AI ไม่ตอบข้อความกลับมา — ลองใหม่อีกครั้ง หรือเลือกประเภทเองไปก่อน" };
    }

    return { ok: true, content: String(content).trim() };
  } catch (err) {
    if (err && err.name === "AbortError") {
      return { ok: false, message: "เรียก AI นานเกิน 15 วินาที — เครือข่ายอาจช้า ลองใหม่อีกครั้ง หรือเลือกประเภทเองไปก่อน" };
    }
    return { ok: false, message: "เรียก AI ไม่สำเร็จ (เครือข่ายมีปัญหา) — ลองใหม่อีกครั้ง หรือเลือกประเภทเองไปก่อน" };
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────
// ตัดคำตอบของ AI ให้เหลือแต่ข้อความ แล้วลอกเครื่องหมายคำพูด/จุด/ช่องว่างส่วนเกินออก
// ─────────────────────────────────────────────────────────
function ตัดแต่งคำตอบ(text) {
  return String(text)
    .trim()
    .replace(/^["'“”‘’.\s]+/, "")
    .replace(/["'“”‘’.\s]+$/, "")
    .trim();
}

// ─────────────────────────────────────────────────────────
// suggestPattern(description, patterns)
// patterns: [{ id, name }, ...]
// คืน { ok:true, pattern: {id, name} } หรือ { ok:false, message } (ภาษาไทย) — ห้าม throw
// ส่งไปให้ AI เฉพาะข้อความรายละเอียดเหตุการณ์และรายชื่อประเภท ห้ามส่งชื่อครู/นักเรียน/อีเมล/โซน/หัวข้อ
// ─────────────────────────────────────────────────────────
export async function suggestPattern(description, patterns) {
  try {
    const descriptionText = description ? String(description).trim() : "";
    if (!descriptionText) {
      return { ok: false, message: "พิมพ์รายละเอียดเหตุการณ์ก่อน แล้วค่อยกดให้ AI ช่วย" };
    }

    const types = Array.isArray(patterns) ? patterns.filter((p) => p && p.name) : [];
    if (types.length === 0) {
      return { ok: false, message: "ยังไม่มีประเภทเหตุการณ์ในระบบ ให้ AI เสนอไม่ได้" };
    }

    const ตั้งค่า = await โหลดค่าตั้งค่า();
    if (!ตั้งค่า.ok) return ตั้งค่า;

    const รายชื่อประเภท = types.map((t) => t.name);

    const messages = [
      {
        role: "system",
        content:
          `คุณคือผู้ช่วยของระบบดูแลความปลอดภัยสนามเด็กเล่นในโรงเรียน ` +
          `หน้าที่ของคุณคือจัดประเภทเหตุการณ์ที่เห็นจากกล้องวงจรปิด (CCTV) ให้ตรงกับ "ประเภทเหตุการณ์เพียงประเภทเดียว" ` +
          `จากรายชื่อที่มีอยู่จริงในระบบเท่านั้น รายชื่อประเภทเหตุการณ์คือ: ${รายชื่อประเภท.join(", ")} ` +
          `อ่านข้อความรายละเอียดเหตุการณ์ที่ผู้ใช้พิมพ์มา แล้วตอบกลับด้วย "ชื่อประเภทเหตุการณ์เพียงชื่อเดียว" ` +
          `ที่ตรงกับรายชื่อข้างต้นเป๊ะ ๆ เท่านั้น ห้ามตอบอย่างอื่นเพิ่มเติม ห้ามอธิบาย ห้ามใส่เครื่องหมายคำพูดหรือจุด`,
      },
      { role: "user", content: descriptionText },
    ];

    const ผล = await เรียกAI({ apiKey: ตั้งค่า.apiKey, model: ตั้งค่า.model, messages, temperature: 0 });
    if (!ผล.ok) return ผล;

    const คำตอบ = ตัดแต่งคำตอบ(ผล.content);

    // ตรงเป๊ะกับชื่อประเภทใดชื่อหนึ่ง
    let ที่ตรงกัน = types.find((t) => t.name === คำตอบ);

    // ถ้าไม่ตรงเป๊ะ ลองดูว่ามีชื่อประเภท "เพียงชื่อเดียว" ที่ปรากฏอยู่ในคำตอบหรือไม่
    if (!ที่ตรงกัน) {
      const พบในคำตอบ = types.filter((t) => คำตอบ.includes(t.name));
      if (พบในคำตอบ.length === 1) {
        ที่ตรงกัน = พบในคำตอบ[0];
      }
    }

    if (!ที่ตรงกัน) {
      return { ok: false, message: "AI ตอบประเภทที่ไม่มีในระบบ จึงเสนอให้ไม่ได้ — โปรดเลือกประเภทเอง" };
    }

    return { ok: true, pattern: { id: ที่ตรงกัน.id, name: ที่ตรงกัน.name } };
  } catch {
    return { ok: false, message: "เกิดข้อผิดพลาดที่ไม่คาดคิดระหว่างให้ AI เสนอประเภท — โปรดเลือกประเภทเอง" };
  }
}
