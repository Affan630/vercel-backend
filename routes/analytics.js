const express = require("express")
const Workout = require("../models/Workout")
const auth = require("../middleware/auth")

const router = express.Router()

// Get workout analytics
router.get("/summary", auth, async (req, res) => {
  try {
    const { period = "week" } = req.query

    const startDate = new Date()

    if (period === "week") {
      startDate.setDate(startDate.getDate() - 7)
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1)
    } else if (period === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1)
    }

    const workouts = await Workout.find({
      user: req.user._id,
      date: { $gte: startDate },
    }).sort({ date: 1 })

    // Group by date
    const dailyStats = {}
    const typeStats = { cardio: 0, strength: 0 }
    let totalCalories = 0
    let totalDuration = 0

    workouts.forEach((workout) => {
      const dateKey = workout.date.toISOString().split("T")[0]

      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          calories: 0,
          duration: 0,
          workouts: 0,
        }
      }

      dailyStats[dateKey].calories += workout.caloriesBurned
      dailyStats[dateKey].duration += workout.duration
      dailyStats[dateKey].workouts += 1

      typeStats[workout.type] += 1
      totalCalories += workout.caloriesBurned
      totalDuration += workout.duration
    })

    const dailyData = Object.values(dailyStats)

    res.json({
      dailyData,
      typeStats,
      totalStats: {
        totalWorkouts: workouts.length,
        totalCalories,
        totalDuration,
        averageCalories: workouts.length > 0 ? Math.round(totalCalories / workouts.length) : 0,
        averageDuration: workouts.length > 0 ? Math.round(totalDuration / workouts.length) : 0,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Get monthly progress
router.get("/monthly", auth, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear()

    const monthlyData = await Workout.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$date" },
          totalWorkouts: { $sum: 1 },
          totalCalories: { $sum: "$caloriesBurned" },
          totalDuration: { $sum: "$duration" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    // Fill in missing months with zero values
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const result = months.map((month, index) => {
      const monthData = monthlyData.find((item) => item._id === index + 1)
      return {
        month,
        totalWorkouts: monthData ? monthData.totalWorkouts : 0,
        totalCalories: monthData ? monthData.totalCalories : 0,
        totalDuration: monthData ? monthData.totalDuration : 0,
      }
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
