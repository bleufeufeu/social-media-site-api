const db = require("../db/queries");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

async function handleReturnMyUserDetails(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const userDetails = await db.returnUserById(req.user.id);
    
    return res.status(200).json({ id: userDetails.id, username: userDetails.username })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function handleReturnAllUsersExceptSelf(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const allUsers = await db.returnAllUsersExceptSelf(req.user.id);
    
    return res.status(200).json(allUsers);
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function handleReturnAllPostsByUser(req, res) {
  try {
    const { userId } = req.params;

    const hasAccess = await db.verifyAccessToUser(userId, req.user.id);

    if (hasAccess === null) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const allPosts = await db.returnAllPostsRepostsByUser(userId);

    return res.status(200).json(allPosts);
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function handleReturnAllLikesByUser(req, res) {
  try {
    const { userId } = req.params;

    const hasAccess = await db.verifyAccessToUser(userId, req.user.id);

    if (hasAccess === null) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const allLikes = await db.returnAllLikesByUser(userId);

    return res.status(200).json(allLikes);
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function handleUpdatePassword(req, res) {
  if (!req.user) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const errors = validationResult(req);
  
  try {
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await db.updateUserPassword(
      req.user.id,
      hashedPassword,
    );
    return res.status(201).json({
        message: "Password updated successfully"
    });
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function handleUpdateUserPrivacy(req, res) {
  if (!req.user) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  try {
    const user = await db.updateUserPrivate(req.user.id)
    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function handleUpdateUserDetails(req, res) {
  if (!req.user) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  try {
    const user = await db.updateUserDetails(req.user.id, req.body.profilePic, req.body.bio, req.body.location, req.body.website);
    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function handleBlockUser(req, res) {
  if (!req.user) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { toBlockId } = req.params;

  if (toBlockId === req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  try {
    const user = await db.handleBlockUser(req.user.id, toBlockId);
    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  handleReturnMyUserDetails,
  handleReturnAllUsersExceptSelf,
  handleReturnAllPostsByUser,
  handleReturnAllLikesByUser,
  handleUpdatePassword,
  handleUpdateUserPrivacy,
  handleUpdateUserDetails,
  handleBlockUser
};
