const { Router } = require("express");
const { check } = require("express-validator");
const router = Router();
const verifyToken = require("../middleware/authMiddleware.js");

const usersController = require("../controllers/usersController.js");

router.get("/me", verifyToken, usersController.handleReturnMyUserDetails);

router.get("/all", verifyToken, usersController.handleReturnAllUsersExceptSelf);

router.get("/:userId/posts", verifyToken, usersController.handleReturnAllPostsByUser);
router.get("/:userId/likes", verifyToken, usersController.handleReturnAllLikesByUser);

router.put("/me/private", verifyToken, usersController.handleUpdateUserPrivacy);
router.put("/me/details", verifyToken, usersController.handleUpdateUserDetails);
router.put("/me/newpassword", verifyToken, [
    check("password")
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters long."),
    check("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
  usersController.handleUpdatePassword);

router.put("/:toBlockId/block", verifyToken, usersController.handleBlockUser);

module.exports = router;
