const serverless = require("serverless-http");
const app = require("../server");

const handler = serverless(app);

module.exports = async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error("Serverless function crashed:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};


