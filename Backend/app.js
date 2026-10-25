import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import hrRoutes from "./routes/hrRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests in development
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Supabase Express API!",
  });
});

// Backend health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
  });
});

// Test the actual PostgreSQL database
app.get("/api/db-test", async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database_name,
        NOW() AS server_time
    `);

    res.json({
      success: true,
      message: "Database query successful",
      database: result.rows[0].database_name,
      serverTime: result.rows[0].server_time,
    });
  } catch (error) {
    next(error);
  }
});

// Authentication routes
app.use("/api/auth", authRoutes);

// User management routes (General Manager only)
app.use("/api/users", userRoutes);

// Project management routes (General Manager only)
app.use("/api/projects", projectRoutes);

// Dashboard routes (General Manager only)
app.use("/api/general-manager", dashboardRoutes);

// HR and workforce management routes (HR Manager and General Manager)
app.use("/api/hr", hrRoutes);

// Real-time notifications routes
app.use("/api/notifications", notificationRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Central error handler
app.use((error, req, res, next) => {
  const statusCode = error.status || error.statusCode || 500;
  if (statusCode >= 500) {
    console.error("API error:", error.message || error);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? "Internal server error" : (error.message || "Invalid request"),
  });
});

export default app;
