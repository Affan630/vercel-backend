const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./utils/db");
const authRoutes = require("./routes/auth");
const workoutRoutes = require("./routes/workouts");
const analyticsRoutes = require("./routes/analytics");

const app = express();

// Static
app.use("/uploads", express.static("uploads"));

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB (cached)
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!" });
});

module.exports = app;
