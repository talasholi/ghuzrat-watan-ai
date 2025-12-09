// ===== 1) الموديولات الأساسية =====
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

// تحميل "قاعدة البيانات" rule-based من ملف JSON
// حاوي معلومات: الكلمة المفتاحيّة -> صورة مناسبة
const dbPath = path.join(__dirname, "database.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

// ===== 2) إعداد التطبيق =====
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// 🔊 مهم: إتاحة ملفات static من فولدر public (مثل /audio, /images...)
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

// ===== 5) الراوت الرئيسي API =====
// مهم: خليه ثابت هيك /api/gw/image
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
    console.error(err);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
});

// راوت بسيط للفحص
app.get("/", (req, res) => {
  res.send("Ghuzrat Watan AI API is running ✅");
});

// ===== 6) تشغيل السيرفر =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
