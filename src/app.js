const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

app.use(cors());

app.use(express.json());

const path = require("path");
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const postRoutes = require("./routes/post.routes");
app.use("/posts", postRoutes);

const analyticsRoutes = require("./routes/analytics.routes");
app.use("/analytics", analyticsRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/users", userRoutes);

module.exports = app;