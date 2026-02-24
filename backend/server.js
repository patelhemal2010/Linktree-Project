require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

// Routes
const authRoutes = require("./src/routes/authRoutes");
const linkRoutes = require("./src/routes/linkRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const { redirectAndTrack } = require("./src/controllers/linkController");

const app = express();

// ==========================
// Middlewares
// ==========================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration (allow frontend later)
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"], // allow both ports
  credentials: true
}));

app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==========================
// API Routes
// ==========================

app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Public redirect route (Like Linktree)
app.get("/l/:id", redirectAndTrack);

// ==========================
// 404 JSON Handler
// ==========================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ==========================
// Global Error Handler
// ==========================

app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});


// ==========================
// Server Start
// ==========================

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
