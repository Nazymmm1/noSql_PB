const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

app.use(express.json()); // Important! Allows Express to read JSON body

// Routes
const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const postRoutes = require("./routes/post.routes");
app.use("/posts", postRoutes);

const analyticsRoutes = require("./routes/analytics.routes");
app.use("/analytics", analyticsRoutes);

module.exports = app;
