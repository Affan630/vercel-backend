const express = require("express")
const { body, validationResult } = require("express-validator")
const Workout = require("../models/Workout")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Get all workouts for user
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, startDate, endDate } = req.query

    const query = { user: req.user._id }

    if (type && type !== "all") {
      query.type = type
    }

    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    const workouts = await Workout.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Workout.countDocuments(query)

    res.json({
      workouts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Create workout
router.post(
  "/",
  auth,
  [
    body("exerciseName").trim().isLength({ min: 1 }).withMessage("Exercise name is required"),
    body("type").isIn(["cardio", "strength"]).withMessage("Type must be cardio or strength"),
    body("duration").isNumeric().withMessage("Duration must be a number"),
    body("caloriesBurned").isNumeric().withMessage("Calories burned must be a number"),
    body("date").isISO8601().withMessage("Date must be valid"),
    body("sets").if(body("type").equals("strength")).isInt({ min: 1 }).withMessage("Sets are required for strength exercises"),
    body("reps").if(body("type").equals("strength")).isInt({ min: 1 }).withMessage("Reps are required for strength exercises"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      if (req.body.type === "strength") {
        req.body.sets = Number(req.body.sets);
        req.body.reps = Number(req.body.reps);
      }

      console.log('Workout POST req.body:', req.body);
      const workout = new Workout({
        ...req.body,
        user: req.user._id,
      })
      await workout.save()
      console.log('Workout saved:', workout);

      // Update user streak
      await updateUserStreak(req.user._id, new Date(req.body.date))

      res.status(201).json(workout)
    } catch (error) {
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Update workout
router.put(
  "/:id",
  auth,
  [
    body("exerciseName").trim().isLength({ min: 1 }).withMessage("Exercise name is required"),
    body("type").isIn(["cardio", "strength"]).withMessage("Type must be cardio or strength"),
    body("duration").isNumeric().withMessage("Duration must be a number"),
    body("caloriesBurned").isNumeric().withMessage("Calories burned must be a number"),
    body("date").isISO8601().withMessage("Date must be valid"),
    body("sets").if(body("type").equals("strength")).isInt({ min: 1 }).withMessage("Sets are required for strength exercises"),
    body("reps").if(body("type").equals("strength")).isInt({ min: 1 }).withMessage("Reps are required for strength exercises"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const workout = await Workout.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, {
        new: true,
      })

      if (!workout) {
        return res.status(404).json({ message: "Workout not found" })
      }

      res.json(workout)
    } catch (error) {
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Delete workout
router.delete("/:id", auth, async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!workout) {
      return res.status(404).json({ message: "Workout not found" })
    }

    res.json({ message: "Workout deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Helper function to update user streak
async function updateUserStreak(userId, workoutDate) {
  try {
    const user = await User.findById(userId)
    const today = new Date()
    const workoutDay = new Date(workoutDate)

    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0)
    workoutDay.setHours(0, 0, 0, 0)

    const lastWorkoutDate = user.streak.lastWorkoutDate ? new Date(user.streak.lastWorkoutDate) : null

    if (lastWorkoutDate) {
      lastWorkoutDate.setHours(0, 0, 0, 0)
    }

    let newStreak = user.streak.current

    if (!lastWorkoutDate || workoutDay > lastWorkoutDate) {
      if (!lastWorkoutDate) {
        newStreak = 1
      } else {
        const daysDiff = Math.floor((workoutDay - lastWorkoutDate) / (1000 * 60 * 60 * 24))

        if (daysDiff === 1) {
          newStreak += 1
        } else if (daysDiff > 1) {
          newStreak = 1
        }
      }

      await User.findByIdAndUpdate(userId, {
        "streak.current": newStreak,
        "streak.longest": Math.max(newStreak, user.streak.longest),
        "streak.lastWorkoutDate": workoutDate,
      })
    }
  } catch (error) {
    console.error("Error updating streak:", error)
  }
}

module.exports = router
