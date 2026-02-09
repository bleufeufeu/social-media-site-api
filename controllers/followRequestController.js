const db = require("../db/queries");

async function handleSendFollowRequest(req, res) {
  try {
    const { recipientId } = req.params;

    if (recipientId === req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const followRequest = await db.handleSendFollowRequest(req.user.id, recipientId);

    return res.status(201).json(followRequest);
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function handleAcceptFollowRequest(req, res) {
  try {
    const { senderId } = req.params;

    if (senderId === req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const checkRequest = await db.returnFollowRequest(senderId, req.user.id);
    
    if (checkRequest.recipientId !== req.user.id) {
        return res.status(404).json({ error: "Forbidden"});
    }

    const followRequest = await db.handleAcceptFollowRequest(senderId, req.user.id);

    return res.status(201).json(followRequest);
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}


async function handleDenyFollowRequest(req, res) {
  try {
    const { senderId } = req.params;

    if (senderId === req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const checkRequest = await db.returnFollowRequest(senderId, req.user.id);
    
    if (checkRequest.recipientId !== req.user.id) {
        return res.status(404).json({ error: "Forbidden"});
    }

    const followRequest = await db.handleDenyFollowRequest(senderId, req.user.id);

    return res.status(201).json(followRequest);
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  handleSendFollowRequest,
  handleAcceptFollowRequest,
  handleDenyFollowRequest
};
