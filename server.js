const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./utils/db");

// Import routes
const authRoutes = require("./routes/auth");
const workoutRoutes = require("./routes/workouts");
const analyticsRoutes = require("./routes/analytics");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Connect DB (cached)
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running!" });
});

// Export app — do NOT call app.listen() here!
module.exports = app;

