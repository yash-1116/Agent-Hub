const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || "agenthub-development-secret";

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, walletAddress: user.walletAddress };
}

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, jwtSecret, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) return res.status(400).json({ success: false, message: "Name, email, and a password of at least 8 characters are required." });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ success: false, message: "An account with this email already exists." });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ success: true, token: issueToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not create account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").trim().toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) return res.status(401).json({ success: false, message: "Invalid email or password." });
    res.json({ success: true, token: issueToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not sign in." });
  }
});

router.get("/me", async (req, res) => {
  try {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const claims = jwt.verify(token, jwtSecret);
    const user = await User.findById(claims.sub);
    if (!user) return res.status(401).json({ success: false, message: "Account not found." });
    res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    res.status(401).json({ success: false, message: "Authentication required." });
  }
});

module.exports = router;