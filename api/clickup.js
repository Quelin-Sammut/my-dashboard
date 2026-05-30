export default async function handler(req, res) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const CU_KEY = process.env.VITE_CLICKUP_API_KEY;
  if (!CU_KEY) {
    return res.status(500).json({ error: "ClickUp API key not configured" });
  }

  const { endpoint } = req.query;
  if (!endpoint) {
    return res.status(400).json({ error: "Missing endpoint parameter" });
  }

  const url = `https://api.clickup.com/api/v2${decodeURIComponent(endpoint)}`;

  try {
    const options = {
      method: req.method,
      headers: {
        Authorization: CU_KEY,
        "Content-Type": "application/json",
      },
    };

    if (req.method === "PUT" && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: "ClickUp API request failed", details: error.message });
  }
}
