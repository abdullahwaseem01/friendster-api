const express = require('express');
const validator = require('validator');
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

router.get('/profile/following', authenticate, (req, res) => {
    const username = req.body.username;
    User.findOne({ username: username }, async (err, storedUser) => {
        if (!err) {
            if (!storedUser) {
                res.status(404).json({
                    message: 'User not found'
                });
            } else {
                const followingIDs = storedUser.following;
                let followingArray = [];
                for (const indexFollowingID of followingIDs) {
                    const indexedFollowing = await User.findById(indexFollowingID);
                    const indexedFollowingClean = indexedFollowing.toObject();
                    delete indexedFollowingClean.password;
                    delete indexedFollowingClean.token
                    delete indexedFollowingClean.refreshToken
                    delete indexedFollowingClean.requests
                    followingArray.push(indexedFollowingClean);

                }
                res.status(200).json({
                    following: followingArray
                });

            }

        }
    });
});

router.get('/profile/requests', authenticate, (req, res) => {
    const username = req.body.username;
    User.findOne({ username: username }, async (err, storedUser) => {
        if (!err) {
            if (!storedUser) {
                res.status(404).json({
                    message: 'User not found'
                });
            } else {
                const requestIDs = storedUser.requests;
                let requestsArray = [];
                for (const indexRequestID of requestIDs) {
                    const indexedRequest = await User.findById(indexRequestID);
                    const indexedRequestClean = indexedRequest.toObject();
                    delete indexedRequestClean.password;
                    delete indexedRequestClean.token
                    delete indexedRequestClean.refreshToken
                    delete indexedRequestClean.requests
                    requestsArray.push(indexedRequestClean);

                }
                res.status(200).json({
                    Requests: requestsArray
                });

            }

        }
    });
});


router.patch('/profile/requests/approve', authenticate, (req, res) => {
    const username = req.query.username || req.body.username
    res.redirect(307, '/profile/requests/approve/' + username);
});
router.patch('/profile/requests/approve/:username', authenticate, (req, res) => {
    const requestedUsername = req.params.username;
    const requestingUsername = req.body.username;
    if (validator.isMongoId(requestedUsername)) {
        User.findOne({ username: requestingUsername }, (err, requestingUser) => {
            if (!err) {
                if (!requestingUser) {
                    res.status(400).json({
                        message: 'unable to locate requesting user',
                        error: err
                    });
                } else {
                    User.findById(requestedUsername, async (err, requestedUser) => {
                        if (!err) {
                            if (!requestedUser) {
                                res.status(400).json({
                                    message: 'unable to locate requested user',
                                    error: err
                                });
                            } else {
                                if (requestingUser.requests.includes(requestedUser._id)) {
                                    await requestingUser.requests.pull(requestedUser._id);
                                    await requestingUser.followers.push(requestedUser._id);
                                    requestingUser.save(async (err) => {
                                        if (!err) {
                                            await requestedUser.following.push(requestingUser._id);
                                            requestedUser.save((err) => {
                                                if (!err) {
                                                    res.status(200).json({
                                                        message: 'request deleted. requested user following requested user'
                                                    });
                                                } else {
                                                    res.status(500).json({
                                                        message: 'unable to complete updates',
                                                        error: err
                                                    });
                                                }
                                            });

                                        } else {
                                            res.status(500).json({
                                                message: 'unable to complete updates',
                                                error: err
                                            });
                                        }
                                    });
                                } else {
                                    res.status(404).json({
                                        message: 'follow request not found'
                                    });
                                }
                            }
                        } else {
                            res.status(500).json({
                                message: 'unable to locate requested user',
                                error: err
                            });
                        }
                    });
                }
            } else {
                res.status(500).json({
                    message: 'unable to locate requesting user',
                    error: err
                });
            }
        });
    } else {
        User.findOne({ username: requestingUsername }, (err, requestingUser) => {
            if (!err) {
                if (!requestingUser) {
                    res.status(400).json({
                        message: 'unable to locate requesting user',
                        error: err
                    });
                } else {
                    User.findOne({ username: requestedUsername }, async (err, requestedUser) => {
                        if (!err) {
                            if (!requestedUser) {
                                res.status(400).json({
                                    message: 'unable to locate requested user',
                                    error: err
                                });
                            } else {
                                if (requestingUser.requests.includes(requestedUser._id)) {
                                    await requestingUser.requests.pull(requestedUser._id);
                                    await requestingUser.followers.push(requestedUser._id);
                                    requestingUser.save(async (err) => {
                                        if (!err) {
                                            await requestedUser.following.push(requestingUser._id);
                                            requestedUser.save((err) => {
                                                if (!err) {
                                                    res.status(200).json({
                                                        message: 'request deleted. requested user following requesting user'
                                                    });
                                                } else {
                                                    res.status(500).json({
                                                        message: 'unable to complete updates',
                                                        error: err
                                                    });
                                                }
                                            });
                                        } else {
                                            res.status(500).json({
                                                message: 'unable to complete updates',
                                                error: err
                                            });
                                        }
                                    });
                                } else {
                                    res.status(404).json({
                                        message: 'follow request not found'
                                    })
                                }

                            }

                        } else {
                            res.status(500).json({
                                message: 'unable to locate requested user',
                                error: err
                            });
                        }
                    });
                }
            } else {
                res.status(500).json({
                    message: 'unable to locate requesting user',
                    error: err
                });
            }
        });

    }
});

router.delete('/profile/requests/delete', authenticate, (req, res) => {
    const username = req.query.username || req.body.username
    res.redirect(307, '/profile/requests/delete/' + username);
});
router.delete('/profile/requests/delete/:username', authenticate, (req, res) => {
    const requestedUsername = req.params.username;
    const requestingUsername = req.body.username;
    if (validator.isMongoId(requestedUsername)) {
        User.findOne({ username: requestingUsername }, (err, requestingUser) => {
            if (!err) {
                if (!requestingUser) {
                    res.status(400).json({
                        message: 'unable to locate requesting user',
                        error: err
                    });
                } else {
                    User.findById(requestedUsername, async (err, requestedUser) => {
                        if (!err) {
                            if (!requestedUser) {
                                res.status(400).json({
                                    message: 'unable to locate requested user',
                                    error: err
                                });
                            } else {
                                if (requestingUser.requests.includes(requestedUser._id)) {
                                    await requestingUser.requests.pull(requestedUser._id);
                                    requestingUser.save(async (err) => {
                                        if (!err) {
                                            res.status(200).json({
                                                message: 'request deleted'
                                            });
                                        } else {
                                            res.status(500).json({
                                                message: 'unable to complete updates',
                                                error: err
                                            });
                                        }
                                    });
                                } else {
                                    res.status(404).json({
                                        message: 'follow request not found'
                                    })
                                }
                            }
                        } else {
                            res.status(500).json({
                                message: 'unable to locate requested user',
                                error: err
                            });
                        }

                    });
                }
            } else {
                res.status(500).json({
                    message: 'unable to locate requesting user',
                    error: err
                });
            }
        });
    } else {
        User.findOne({ username: requestingUsername }, (err, requestingUser) => {
            if (!err) {
                if (!requestingUser) {
                    res.status(400).json({
                        message: 'unable to locate requesting user',
                        error: err
                    });
                } else {
                    User.findOne({ username: requestedUsername }, async (err, requestedUser) => {
                        if (!err) {
                            if (!requestedUser) {
                                res.status(400).json({
                                    message: 'unable to locate requested user',
                                    error: err
                                });
                            } else {
                                if (requestingUser.requests.includes(requestedUser._id)) {
                                    await requestingUser.requests.pull(requestedUser._id);
                                    requestingUser.save(async (err) => {
                                        if (!err) {
                                            res.status(200).json({
                                                message: 'request deleted'
                                            });
                                        } else {
                                            res.status(500).json({
                                                message: 'unable to complete updates',
                                                error: err
                                            });
                                        }
                                    });
                                } else {
                                    res.status(404).json({
                                        message: 'follow request not found'
                                    });
                                }

                            }
                        } else {
                            res.status(500).json({
                                message: 'unable to locate requested user',
                                error: err
                            });
                        }
                    });
                }
            } else {
                res.status(500).json({
                    message: 'unable to locate requesting user',
                    error: err
                });
            }
        });

    }
});

module.exports = router;