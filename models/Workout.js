const mongoose = require("mongoose")

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    exerciseName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["cardio", "strength"],
      lowercase: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    caloriesBurned: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    sets: {
      type: Number,
      min: 1,
      required: function() { return this.type === 'strength'; },
    },
    reps: {
      type: Number,
      min: 1,
      required: function() { return this.type === 'strength'; },
    },
  },
  {
    timestamps: true,
  },
)

workoutSchema.index({ user: 1, date: -1 })

module.exports = mongoose.model("Workout", workoutSchema)
