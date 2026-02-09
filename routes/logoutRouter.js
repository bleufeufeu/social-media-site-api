const { Router } = require("express");
const router = Router();

const logoutController = require("../controllers/logoutController.js");

router.get("/", logoutController.handleLogout);

module.exports = router;