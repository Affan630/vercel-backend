const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
require("dotenv").config()

const authRoutes = require("./routes/auth")
const workoutRoutes = require("./routes/workouts")
const analyticsRoutes = require("./routes/analytics")

const app = express()

// Serve uploads directory for profile images
app.use('/uploads', express.static('uploads'))

// Middleware
app.use(cors())
app.use(express.json())

// Connect to MongoDB (only if not already connected)
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
}

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/workouts", workoutRoutes)
app.use("/api/analytics", analyticsRoutes)

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!" })
})

module.exports = app   // <-- export app instead of app.listen
