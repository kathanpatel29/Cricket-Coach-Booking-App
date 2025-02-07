const Coach = require("../models/Coach")
const User = require("../models/User")

exports.createCoachProfile = async (req, res) => {
  try {
    const { specialization, experience, hourlyRate, bio } = req.body

    // Check if profile already exists
    const existingProfile = await Coach.findOne({ user: req.user.id });
    if (existingProfile) {
      return res.status(400).json({ message: "Coach profile already exists" });
    }

    // Create coach profile
    const coach = await Coach.create({
      user: req.user.id,
      specialization,
      experience,
      hourlyRate,
      bio,
      availability: [],
      ratings: [],
      reviews: [],
    })

    // Update user role and set initial approval status
    await User.findByIdAndUpdate(req.user.id, { 
      role: "coach",
      isApproved: false
    })

    res.status(201).json(coach)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getAllCoaches = async (req, res) => {
  try {
    const coaches = await Coach.find()
      .populate("user", "name email isApproved")
      .select("specialization experience hourlyRate bio averageRating")
    res.json(coaches)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getCoachById = async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id)
      .populate("user", "name email isApproved")
      .select("specialization experience hourlyRate bio averageRating availability")
    
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" })
    }

    // Only return availability if coach is approved
    if (!coach.user.isApproved) {
      coach.availability = [];
    }

    res.json(coach)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.updateCoachProfile = async (req, res) => {
  try {
    const { specialization, experience, hourlyRate, bio } = req.body

    // Find the coach profile
    const coach = await Coach.findOneAndUpdate(
      { user: req.user.id },
      { specialization, experience, hourlyRate, bio },
      { new: true }
    ).populate("user", "name email isApproved");

    if (!coach) {
      return res.status(404).json({ message: "Coach profile not found" })
    }

    res.json(coach)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getCoachProfile = async (req, res) => {
  try {
    const coach = await Coach.findOne({ user: req.user.id })
      .populate("user", "name email isApproved");
    
    if (!coach) {
      return res.status(404).json({ message: "Coach profile not found" });
    }

    res.json(coach);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { date, capacity } = req.body;
    
    // Check if coach is approved
    const user = await User.findById(req.user.id);
    if (!user.isApproved) {
      return res.status(403).json({ message: "Coach needs to be approved to manage availability" });
    }

    const coach = await Coach.findOneAndUpdate(
      { user: req.user.id },
      { $push: { availability: { date, capacity } } },
      { new: true }
    );

    res.json(coach);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Pending Coaches
exports.pendingCoaches = async (req, res) => {
  try {
    const pendingCoaches = await User.find({ role: "coach", isApproved: false });
    res.json(pendingCoaches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Approve Coach
exports.approveCoach = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(

      req.params.id, 
      { isApproved: true }, 
      { new: true }
    ).select("name email role isApproved");

    if (!user) {
      return res.status(404).json({ message: "Coach not found" })
    }
    res.json({ message: "Coach approved successfully", user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
};

//Reject Coach
exports.rejectCoach = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { 
        role: "client",
        isApproved: false 
      }, 
      { new: true }
    ).select("name email role isApproved");

    if (!user) {
      return res.status(404).json({ message: "Coach not found" })
    }

    // Remove coach profile
    await Coach.findOneAndDelete({ user: req.params.id });

    res.json({ message: "Coach rejected successfully", user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
};