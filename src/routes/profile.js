const express = require('express');
const app = require('../app.js');
const router = express.Router();
const authenticate = require('../authentication/authenticate.js').authenticate;
const User = require('../models/user.js');

router.get('/profile', authenticate, (req, res) => {
    const username = req.body.username;
    User.findOne({ username: username }, async (err, storedUser) => {
        if (!err) {
            if (!storedUser) {
                res.status(404).json({
                    message: 'User not found'
                });
            } else {
                const user = storedUser.toObject();
                await delete user.password;
                await delete user.token
                await delete user.refreshToken
                res.status(200).json({
                    message: 'User found',
                    user: user
                });
            }

        }
    });
});

router.get('/profile/followers', authenticate, (req, res) => {
    const username = req.body.username;
    User.findOne({ username: username }, async (err, storedUser) => {
        if (!err) {
            if (!storedUser) {
                res.status(404).json({
                    message: 'User not found'
                });
            } else {
                const followersIDs = storedUser.followers;
                let followersArray = [];
                for (const indexFollowerID of followersIDs) {
                    const indexedFollower = await User.findById(indexFollowerID);
                    const indexedFollowerClean = indexedFollower.toObject();
                    delete indexedFollowerClean.password;
                    delete indexedFollowerClean.token
                    delete indexedFollowerClean.refreshToken
                    delete indexedFollowerClean.requests
                    followersArray.push(indexedFollowerClean);
                    
                }
                res.status(200).json({
                    followers: followersArray
                });
                
            }

        }
    });
});


module.exports = router;