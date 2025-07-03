
const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post("/submit-survey", async (req, res) => {
  const { customerId, answers } = req.body;

  if (!customerId || !answers) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const metafieldUpdates = Object.entries(answers).map(([key, value]) => ({
      namespace: "survey",
      key,
      type: "single_line_text_field",
      value: typeof value === "string" ? value : value.join(", ")
    }));

    const response = await axios.post(
      `https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/api/${process.env.API_VERSION}/customers/${customerId}/metafields.json`,
      { metafields: metafieldUpdates },
      {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_API_TOKEN,
          "Content-Type": "application/json",
        }
      }
    );

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error("❌ Error submitting survey:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to submit survey" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Survey API listening on port ${PORT}`);
});
