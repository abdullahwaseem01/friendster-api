const express = require('express');
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
                })
                
            }

        }
    });
});

router.delete('/profile/followers', authenticate, (req, res) => {
    const username = req.query.username || req.body.username
    res.redirect(307, '/profile/followers/' + username);
});

router.delete('/profile/followers/:username', authenticate, (req, res) => {
    const requestedUsername = req.params.username;
    const requestingUsername = req.body.username;
    User.findOne({ username: requestedUsername }, (err, requestedUser) => {
        if (!err) {
            if (!requestedUser) {
                res.status(404).json({
                    message: 'Requested user not found'
                });
            }
            else {
                User.findOne({ username: requestingUsername }, async (error, requestingUser) => {
                    if (!error) {
                        if (!requestingUser) {
                            res.status(404).json({
                                message: "Requesting user not found"
                            })
                        } else {
                            if (requestedUser.followers.includes(requestingUser._id) && requestingUser.following.includes(requestedUser._id)) {
                                requestedUser.followers.pull(requestingUser._id)
                                requestedUser.save(async (error) => {
                                    if (!error) {
                                        requestingUser.following.pull(requestedUser._id);
                                        requestingUser.save((error) => {
                                            if (!error) {
                                                res.status(200).json({
                                                    message: 'Requested user unfollowed'
                                                })
                                            } else {
                                                res.status(500).json({
                                                    message: 'Error unfollowing',
                                                    error: error
                                                });
                                            }
                                        })
                                    } else {
                                        res.status(500).json({
                                            message: 'Error removing follower',
                                            error: error
                                        });
                                    }
                                })
                            } else {
                                res.status(400).json({
                                    message: "Requesting user not following requested user"
                                })
                            }
                        }
                    } else {
                        res.status(500).json({
                            message: "Requesting user not found",
                            error: error
                        });
                    }
                });
            }
        }
        else {
            res.status(500).json({
                message: 'unable to find user',
                error: err
            });
        }
    });
});

module.exports = router;