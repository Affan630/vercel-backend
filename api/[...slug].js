const app = require("../../server");
const serverless = require("serverless-http");

module.exports = (req, res) => {
  const handler = serverless(app);
  return handler(req, res);
};

