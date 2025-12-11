// ===== 1) الموديولات الأساسية =====
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

// 🔹 مكتبة OpenAI
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // لازم تكون مضافة في Render
});

// تحميل "قاعدة البيانات" rule-based من ملف JSON
// حاوي معلومات: الكلمة المفتاحيّة -> صورة مناسبة
const dbPath = path.join(__dirname, "database.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

// ===== 2) إعداد التطبيق =====
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// 🔊 مهم: إتاحة ملفات static من فولدر public (مثل /audio, /images... /design-dress.htm)
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// أسماء "الموديلات" (شكلية عشان المنظر بس 😄)
const TEXT_MODEL_NAME = "gw-simple-parser-v1";
const IMAGE_MODEL_NAME = "gw-static-mapper-v1";

// ===== 3) دالة: تحويل وصف المستخدم إلى JSON منظم =====
function parseDescriptionToJson(description) {
  const text = (description || "").toLowerCase();

  // مثال بسيط: نستخرج كلمات مفتاحية
  const keywords = [];

  if (
    text.includes("thobe") ||
    text.includes("thawb") ||
    text.includes("dress")
  ) {
    keywords.push("thobe");
  }
  if (text.includes("red")) keywords.push("red");
  if (text.includes("black")) keywords.push("black");
  if (text.includes("bag")) keywords.push("bag");
  if (text.includes("necklace") || text.includes("accessory"))
    keywords.push("accessory");
  if (text.includes("tatreez") || text.includes("embroidery"))
    keywords.push("tatreez");

  return {
    model: TEXT_MODEL_NAME,
    raw_text: description,
    keywords,
  };
}

// ===== 4) دالة: اختيار صورة مناسبة من "قاعدة البيانات" =====
function mapJsonToImage(parsedJson) {
  const { keywords } = parsedJson;

  // نحاول نطابق أول keyword موجودة في db
  for (const kw of keywords) {
    if (db[kw]) {
      return {
        model: IMAGE_MODEL_NAME,
        keyword_matched: kw,
        image_url: db[kw].image_url,
        title: db[kw].title,
      };
    }
  }

  // لو ما لقينا إشي، نرجع صورة افتراضية
  return {
    model: IMAGE_MODEL_NAME,
    keyword_matched: null,
    image_url:
      db.default?.image_url ||
      "https://via.placeholder.com/600x800?text=Ghuzrat+Watan",
    title: db.default?.title || "Default Ghuzrat Watan Image",
  };
}

// ===== 5) الراوت rule-based القديم (من database.json) =====
// /api/gw/image  ← هذا يختار صورة من database.json
app.post("/api/gw/image", (req, res) => {
  try {
    const description = req.body.description || "";
    const parsed = parseDescriptionToJson(description);
    const imageResult = mapJsonToImage(parsed);

    return res.json({
      ok: true,
      description,
      parsed,
      image: imageResult, // image.image_url داخلها
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
});

// ===== 6) راوت جديد يستخدم OpenAI لتوليد صورة من الوصف =====
app.post("/api/gw/generate-dress", async (req, res) => {
  try {
    const description = req.body.description || "";

    if (!description.trim()) {
      return res.status(400).json({
        ok: false,
        error: "الرجاء إدخال وصف للثوب",
      });
    }

    // ممكن نستفيد من نفس الـ parser عشان نرجع تحليلاً في الواجهة
    const parsed = parseDescriptionToJson(description);

    const prompt = `
High-quality fashion illustration of a modest Palestinian embroidered dress.
Full dress visible, front view, neutral background, no face details.
Traditional yet modern style, suitable for an online shop.
User description (Arabic or English): ${description}
`;

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    const imageUrl =
      result &&
      result.data &&
      result.data[0] &&
      (result.data[0].url || result.data[0].url === "" ? result.data[0].url : null);

    if (!imageUrl) {
      console.error("No image URL returned from OpenAI:", result);
      return res.status(500).json({
        ok: false,
        error: "فشل في الحصول على رابط الصورة من نموذج الذكاء الاصطناعي.",
      });
    }

    // نرجّع عدّة أشكال لنفس الرابط عشان أي واجهة تشتغل:
    // - image.url
    // - image_url
    // - imageUrl
    // - images[0].url (اختياري)
    return res.json({
      ok: true,
      description,
      parsed,
      imageUrl, // camelCase
      image_url: imageUrl, // snake_case
      image: {
        model: "gpt-image-1",
        url: imageUrl,
      },
      images: [
        {
          url: imageUrl,
        },
      ],
    });
  } catch (error) {
    console.error("Error in /api/gw/generate-dress:", error);

    // نحاول نرجّع رسالة أوضح لو من OpenAI
    let msg = "فشل في إنشاء الصورة، حاولي مرة أخرى لاحقًا.";
    if (error && error.error && error.error.message) {
      msg = "خطأ من مزود النموذج: " + error.error.message;
    }

    return res.status(500).json({
      ok: false,
      error: msg,
    });
  }
});

// راوت بسيط للفحص
app.get("/", (req, res) => {
  res.send("Ghuzrat Watan AI API is running ✅");
});

// ===== 7) تشغيل السيرفر =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
