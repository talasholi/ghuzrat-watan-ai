// ===== 1) الموديولات الأساسية =====
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

// ===== 1.1 مكتبة OpenAI (الإصدار الجديد v4) =====
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // تأكدي موجود في Render
});

// تحميل "قاعدة البيانات" rule-based من ملف JSON
const dbPath = path.join(__dirname, "database.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

// ===== 2) إعداد التطبيق =====
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ملفات static من public
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// أسماء شكلية للموديلات
const TEXT_MODEL_NAME = "gw-simple-parser-v1";
const IMAGE_MODEL_NAME = "gw-static-mapper-v1";

// ===== 3) دالة: تحويل وصف المستخدم إلى JSON منظم =====
function parseDescriptionToJson(description) {
  const text = (description || "").toLowerCase();
  const keywords = [];

  if (
    text.includes("thobe") ||
    text.includes("thawb") ||
    text.includes("dress")
  ) {
    keywords.push("thobe");
  }
  if (text.includes("red") || text.includes("احمر") || text.includes("أحمر"))
    keywords.push("red");
  if (text.includes("black") || text.includes("اسود") || text.includes("أسود"))
    keywords.push("black");
  if (text.includes("bag") || text.includes("حقيبة") || text.includes("شنطة"))
    keywords.push("bag");
  if (
    text.includes("necklace") ||
    text.includes("accessory") ||
    text.includes("اكسسوار") ||
    text.includes("إكسسوار")
  )
    keywords.push("accessory");
  if (text.includes("tatreez") || text.includes("تطريز") || text.includes("مطرز"))
    keywords.push("tatreez");

  return {
    model: TEXT_MODEL_NAME,
    raw_text: description,
    keywords,
  };
}

// ===== 4) دالة: اختيار صورة من database.json =====
function mapJsonToImage(parsedJson) {
  const { keywords } = parsedJson;

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

  return {
    model: IMAGE_MODEL_NAME,
    keyword_matched: null,
    image_url:
      db.default?.image_url ||
      "https://via.placeholder.com/600x800?text=Ghuzrat+Watan",
    title: db.default?.title || "Default Ghuzrat Watan Image",
  };
}

// ===== 5) الراوت القديم rule-based (احتياط / باك أب) =====
app.post("/api/gw/image", (req, res) => {
  try {
    const description = req.body.description || "";
    const parsed = parseDescriptionToJson(description);
    const imageResult = mapJsonToImage(parsed);

    return res.json({
      ok: true,
      description,
      parsed,
      image: imageResult,
    });
  } catch (err) {
    console.error("Error in /api/gw/image:", err);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
});

// ===== 6) الراوت الجديد: توليد صورة بالذكاء الاصطناعي =====
app.post("/api/gw/generate-dress", async (req, res) => {
  try {
    const description = req.body.description || "";

    if (!description.trim()) {
      return res.status(400).json({
        ok: false,
        error: "الرجاء إدخال وصف للثوب",
      });
    }

    const prompt = `
High-quality fashion illustration of a modest Palestinian embroidered dress.
Full dress visible, front view, neutral background, no face details.
Traditional yet modern style, suitable for an online shop.
User description (Arabic or English): ${description}
`;

    // ⚠️ مهم: لا يوجد هنا response_format نهائياً
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      // لا تضعي response_format هنا
    });

    console.log("OpenAI images.generate raw result:", JSON.stringify(result, null, 2));

    const first = result.data && result.data[0];
    const imageUrl = first && (first.url || first.b64_json || first.image_url);

    if (!imageUrl) {
      console.error("No image URL in OpenAI response:", result);
      return res.status(500).json({
        ok: false,
        error: "فشل في الحصول على رابط الصورة من نموذج الذكاء الاصطناعي.",
      });
    }

    return res.json({
      ok: true,
      description,
      imageUrl,
    });
  } catch (error) {
    console.error("Error in /api/gw/generate-dress:", error?.response?.data || error);
    return res.status(500).json({
      ok: false,
      error: "فشل في إنشاء الصورة، حاولي مرة أخرى لاحقاً.",
    });
  }
});

// ===== 7) راوت بسيط للفحص =====
app.get("/", (req, res) => {
  res.send("Ghuzrat Watan AI API is running ✅");
});

// ===== 8) تشغيل السيرفر =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
