const env = require("dotenv");
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
env.config();

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const rocheRoutes = require("./api/routes/rocheRoutes");
app.use("/api", rocheRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
