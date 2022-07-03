const express = require('express');
const router = express.Router();
const authenticate = require('../authentication/authenticate.js').authenticate;
const User = require('../models/user.js');

router.get('/feed', authenticate,  (req, res) => {
    const username = req.body.username;
    User.findOne({ username: username }, async (err, storedUser) => {
        if (!err) {
            if (!storedUser) {
                res.status(404).json({
                    message: 'User not found'
                });
            } else {
                const followerIDs = storedUser.following;
                let postsArray = [];
                for (const indexFollowerID of followerIDs) {
                    const indexedFollower = await User.findById(indexFollowerID);
                    postsArray.push(indexedFollower.posts);
                }
                res.status(200).json({
                    message: 'user feed found',
                    posts: postsArray
                });
            }

        }
    });
});

module.exports = router;