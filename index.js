const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const dbPath = path.join(__dirname, "database.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

const TEXT_MODEL_NAME = "gw-simple-parser-v1";
const IMAGE_MODEL_NAME = "gw-static-mapper-v1";

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

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    const imgObj = (result.data && result.data[0]) || {};
    console.log("OpenAI image keys:", Object.keys(imgObj));

    let imageUrl = null;

    if (imgObj.url) {
      imageUrl = imgObj.url;
    } else if (imgObj.b64_json) {
      imageUrl = `data:image/png;base64,${imgObj.b64_json}`;
    }

    if (!imageUrl) {
      console.error("NO url or b64_json in image result:", imgObj);
      return res.status(500).json({
        ok: false,
        error: "لم يتم استلام بيانات صالحة للصورة من نموذج الذكاء الاصطناعي.",
      });
    }

    return res.json({
      ok: true,
      description,
      imageUrl,
    });
  } catch (error) {
    console.error("Error in /api/gw/generate-dress:", error);
    return res.status(500).json({
      ok: false,
      error: "فشل في إنشاء الصورة، حاولي مرة أخرى لاحقًا.",
    });
  }
});

app.get("/", (req, res) => {
  res.send("Ghuzrat Watan AI API is running ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
