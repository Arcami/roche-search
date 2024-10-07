const express = require("express");
const serverless = require("serverless-http");
const rocheRoutes = require("../../api/routes/rocheRoutes");
const cors = require("cors");

const app = express();

app.use(cors());

// Middleware
app.use(express.json());

// Use your existing routes
app.use("/.netlify/functions/api", rocheRoutes);

// Export the serverless function
module.exports.handler = serverless(app);
