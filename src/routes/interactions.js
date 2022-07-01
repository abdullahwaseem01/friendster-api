
const express = require('express');
const router = express.Router();
const authenticate = require('../authentication/authenticate.js').authenticate;
const User = require('../models/user.js');

router.patch('/follow', authenticate, (req, res) => {
    const username = req.query.username || req.body.username
    res.redirect(307, '/follow/' + username);
});

router.patch('/follow/:username', authenticate, (req, res) => {
    const requestedUsername = req.params.username;
    const requestingUsername = req.body.username;
    User.findOne({ username: requestedUsername }, async (err, requestedUser) => {
        if (!err) {
            if (!requestedUser) {
                res.status(404).json({
                    message: 'Requested user not found'
                });
            } else {
                User.findOne({ username: requestingUsername }, async (error, requestingUser) => {
                    if (!err) {
                        if (!requestingUser) {
                            res.status(404).json({
                                message: 'Requesting user not found'
                            });
                        } else {
                            if (requestedUser.profileStatus === 'private') {
                                if (requestedUser.requests.includes(requestingUser._id)) {
                                    res.status(200).json({
                                        message: 'User already requested'
                                    });
                                } else {
                                    requestedUser.requests.push(requestingUser._id);
                                    requestedUser.save((error) => {
                                        if (!error) {
                                            res.status(200).json({
                                                message: 'Requested user private, request sent'
                                            });
                                        } else {
                                            res.status(500).json({
                                                message: 'Error sending request',
                                                error: error
                                            });
                                        }

                                    });
                                }
                            } else {
                                if (requestedUser.followers.includes(requestingUser._id)) {
                                    res.status(200).json({
                                        message: 'User already following'
                                    });
                                }
                                else {
                                    requestedUser.followers.push(requestingUser);
                                    requestingUser.following.push(requestedUser);
                                    requestedUser.save((error) => {
                                        if (!error) {
                                            requestingUser.save((error) => {
                                                if (!error) {
                                                    res.status(200).json({
                                                        message: 'Requested user public, following user'
                                                    });
                                                } else {
                                                    res.status(500).json({
                                                        message: 'Error following user',
                                                        error: error
                                                    });
                                                }
                                            });
                                        } else {
                                            res.status(500).json({
                                                message: 'Error following user',
                                                error: error
                                            });
                                        }
                                    });
                                }

                            }
                        }
                    } else {
                        res.status(500).json({
                            message: 'unable to find user',
                            error: error
                        })
                    }
                });
            }
        } else {
            res.status(500).json({
                message: 'unable to find user',
                error: err
            });
        }
    });

});

router.delete('/unfollow', authenticate, (req, res) => {
    const username = req.query.username || req.body.username
    res.redirect(307, '/unfollow/' + username);
});

router.delete('/unfollow/:username', authenticate, (req, res) => {
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