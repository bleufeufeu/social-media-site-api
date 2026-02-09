const { Router } = require("express");
const router = Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

const loginController = require("../controllers/loginController.js");

router.post("/", loginController.handleLogin);

router.get("/github", passport.authenticate("github", { scope: ['read:user']}));
router.get("/github/callback", 
  passport.authenticate("github", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    console.log("Callback reached, user:", req.user);
    const user = req.user

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRETKEY, { expiresIn: "24h"});

    res.json({ token, user: { id: user.id, username: user.username }});
  });

module.exports = router;
