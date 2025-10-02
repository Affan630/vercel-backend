const express = require("express")
const jwt = require("jsonwebtoken")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const auth = require("../middleware/auth")
const multer = require("multer")
const path = require("path")

// Multer setup for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/"))
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    cb(null, req.user._id + "-profile" + ext)
  },
})
function fileFilter (req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
}
const upload = multer({ storage, fileFilter })

const router = express.Router()

// Register
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { name, email, password } = req.body

      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" })
      }

      const user = new User({ name, email, password })
      await user.save()

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "fallback-secret", { expiresIn: "7d" })

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          goals: user.goals,
          streak: user.streak,
        },
      })
    } catch (error) {
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password } = req.body

      const user = await User.findOne({ email })
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" })
      }

      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" })
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "fallback-secret", { expiresIn: "7d" })

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          goals: user.goals,
          streak: user.streak,
        },
      })
    } catch (error) {
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        goals: req.user.goals,
        streak: req.user.streak,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Update user goals
router.put(
  "/goals",
  auth,
  [
    body("weeklyCalories").isNumeric().withMessage("Weekly calories must be a number"),
    body("weeklyWorkouts").isNumeric().withMessage("Weekly workouts must be a number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { weeklyCalories, weeklyWorkouts } = req.body

      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          goals: { weeklyCalories, weeklyWorkouts },
        },
        { new: true },
      ).select("-password")

      res.json({ user })
    } catch (error) {
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Update user profile (name, email, password, profile picture)
router.put(
  "/me",
  auth,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { name, email, password, bio } = req.body
      const updateFields = {}
      if (name) updateFields.name = name
      if (email) updateFields.email = email
      if (bio !== undefined) updateFields.bio = bio
      if (req.file) {
        updateFields.profilePicture = `/uploads/${req.file.filename}`
      }
      let user = await User.findById(req.user._id)
      if (!user) return res.status(404).json({ message: "User not found" })
      if (password && password.length >= 6) {
        user.password = password
      }
      Object.assign(user, updateFields)
      await user.save()
      user = user.toObject()
      delete user.password
      res.json({ user })
    } catch (error) {
      console.error('Profile update error:', error);
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ message: 'File upload error: ' + error.message });
      }
      if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" })
    }
  }
)

module.exports = router
