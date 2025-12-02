// ===== 1) الموديولات الأساسية =====
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

// ===== 2) تحميل قاعدة البيانات rule-based من الملف =====
const dbPath = path.join(__dirname, "database.json");
let db = { styles: {}, colors: {}, patterns: {} };

try {
  db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  console.log("✅ database.json loaded");
} catch (err) {
  console.error(
    "⚠️ لم يتم قراءة database.json، سيتم استخدام قيم افتراضية",
    err,
  );
}

// ===== 3) إعداد التطبيق =====
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// "أسماء الموديلات" كمتغيرات (زي ما قال لك صاحبك)
const TEXT_MODEL_NAME = "gw-simple-parser-v1";
const IMAGE_MODEL_NAME = "gw-static-mapper-v1";

// ===== 4) دالة: تحويل وصف المستخدم إلى JSON منظم =====
function parseDescriptionToJson(description) {
  const text = (description || "").toLowerCase();

  // اللون
  let baseColor = "black";
  if (text.includes("احمر") || text.includes("أحمر") || text.includes("red"))
    baseColor = "red";
  else if (
    text.includes("ازرق") ||
    text.includes("أزرق") ||
    text.includes("blue")
  )
    baseColor = "blue";
  else if (
    text.includes("اخضر") ||
    text.includes("أخضر") ||
    text.includes("green")
  )
    baseColor = "green";
  else if (
    text.includes("ابيض") ||
    text.includes("أبيض") ||
    text.includes("white")
  )
    baseColor = "white";

  // الأسلوب (تقليدي / مودرن)
  let style = "traditional";
  if (text.includes("حديث") || text.includes("مودرن") || text.includes("عصري"))
    style = "modern";

  // منطقة التطريز
  let embroideryArea = "full";
  if (text.includes("الصدر") && text.includes("الاكمام"))
    embroideryArea = "chest_and_sleeves";
  else if (text.includes("الصدر")) embroideryArea = "chest_only";
  else if (text.includes("الاكمام") || text.includes("الأكمام"))
    embroideryArea = "sleeves_only";

  // المناسبة
  let formality = "casual";
  if (text.includes("عرس") || text.includes("زفاف") || text.includes("wedding"))
    formality = "wedding";
  else if (text.includes("سهرة") || text.includes("مناسب"))
    formality = "evening";

  return {
    textModel: TEXT_MODEL_NAME,
    imageModel: IMAGE_MODEL_NAME,
    baseColor,
    style,
    embroideryArea,
    formality,
    originalDescription: description,
  };
}

// ===== 5) دالة: اختيار صورة حسب الـ JSON (حاليًا placeholders) =====
function mapJsonToImageUrl(dressSpec) {
  const { baseColor, style, embroideryArea, formality } = dressSpec;

  // هنا لاحقًا حطي روابط صور حقيقية من متجرك بدل placeholders
  if (
    baseColor === "red" &&
    style === "traditional" &&
    embroideryArea === "chest_and_sleeves"
  ) {
    return "https://via.placeholder.com/400x600?text=Red+Traditional+Chest+%2B+Sleeves";
  }

  if (baseColor === "black" && style === "modern") {
    return "https://via.placeholder.com/400x600?text=Black+Modern+Dress";
  }

  if (formality === "wedding") {
    return "https://via.placeholder.com/400x600?text=Wedding+Dress";
  }

  // صورة افتراضية
  return "https://via.placeholder.com/400x600?text=Default+Embroidery+Dress";
}

// ===== 6) API: وصف → JSON → ملف → صورة → يرجّع JSON + imageUrl =====
app.post("/generate-dress", (req, res) => {
  try {
    const description =
      req.body.description || req.body.text || req.body.prompt || "";

    if (!description.trim()) {
      return res.status(400).json({ error: "الرجاء إدخال وصف للثوب" });
    }

    // أ) تحليل الوصف إلى JSON
    const dressSpec = parseDescriptionToJson(description);

    // ب) حفظ JSON في ملف (هذا هو "الملف اللي يغذي النموذج" لو حبيتي تستخدمينه لاحقًا)
    fs.writeFileSync(
      "last-dress.json",
      JSON.stringify(dressSpec, null, 2),
      "utf-8",
    );

    // ج) اختيار صورة حسب JSON
    const imageUrl = mapJsonToImageUrl(dressSpec);

    // د) إعادة النتيجة
    return res.json({
      spec: dressSpec,
      imageUrl,
    });
  } catch (err) {
    console.error("Error in /generate-dress:", err);
    return res.status(500).json({ error: "حدث خطأ في توليد الثوب" });
  }
});

// ===== 7) صفحة بسيطة للاختبار من المتصفح =====
app.get("/test-dress", (req, res) => {
  res.send(`
    <html dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>مولّد أثواب غرزة وطن</title>
      </head>
      <body style="font-family: sans-serif; padding: 20px;">
        <h2>توليد ثوب حسب الوصف - غرزة وطن</h2>
        <p>اكتبي وصف الثوب (لون، نوع التطريز، المناسبة...):</p>
        <textarea id="desc" rows="4" cols="60" style="width:100%;"></textarea>
        <br/><br/>
        <button onclick="generate()">توليد الثوب</button>

        <h3>الصورة الناتجة:</h3>
        <img id="dressImg" src="" style="max-width:300px; border:1px solid #ccc;" />

        <h3>البيانات (JSON):</h3>
        <pre id="jsonBox" style="background:#f5f5f5; padding:10px; border:1px solid #ddd;"></pre>

        <script>
          async function generate() {
            const desc = document.getElementById("desc").value;
            const res = await fetch("/generate-dress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ description: desc })
            });

            const data = await res.json();
            if (data.error) {
              alert(data.error);
              return;
            }

            document.getElementById("dressImg").src = data.imageUrl;
            document.getElementById("jsonBox").textContent = JSON.stringify(data.spec, null, 2);
          }
        </script>
      </body>
    </html>
  `);
});

// ===== 8) راوت رئيسي بسيط =====
app.get("/", (req, res) => {
  res.send("Ghuzrat Watan dress generator (rule-based) is running ✅");
});

// ===== 9) API ثانية: تحويل نص بسيط لوصف إنجليزي باستخدام database.json =====
app.post("/generate-description", (req, res) => {
  const userText = req.body.text?.toLowerCase() || "";

  let style = "traditional Palestinian thobe";
  let color = "classic embroidery colors";
  let pattern = "tatreez patterns";

  for (let key in db.styles) {
    if (userText.includes(key)) style = db.styles[key];
  }

  for (let key in db.colors) {
    if (userText.includes(key)) color = db.colors[key];
  }

  for (let key in db.patterns) {
    if (userText.includes(key)) pattern = db.patterns[key];
  }

  const finalDescription = `A ${style}, featuring ${color}, decorated with ${pattern}.`;

  res.json({ description: finalDescription });
});

// ===== 10) تشغيل السيرفر =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
