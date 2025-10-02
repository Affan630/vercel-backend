// backend/utils/db.js
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("⚠️  Missing MONGODB_URI in environment variables");
}

let cached = global.__mongoose_cached;
if (!cached) {
  cached = global.__mongoose_cached = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(mongoose => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = dbConnect;
