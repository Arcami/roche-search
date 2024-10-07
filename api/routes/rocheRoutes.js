const express = require("express");
const router = express.Router();
const { rocheSearch } = require("../controllers/rocheController");

router.get("/search", rocheSearch);

module.exports = router;
