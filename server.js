import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import workoutRoutes from "./routes/workouts.js";
import authRoutes from "./routes/auth.js";
import analyticsRoutes from "./routes/analytics.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Basic health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is healthy!" });
});

// Routes
app.use("/api/workouts", workoutRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);


export default app;
