const serverless = require("serverless-http");
const app = require("../server");

module.exports = async (req, res) => {
  try {
    const handler = serverless(app);
    return await handler(req, res);
  } catch (err) {
    console.error("Serverless function crashed:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};

