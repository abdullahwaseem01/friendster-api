require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const async = require('async');
const registerRoutes = require('./routes/register.js');
const authenticate = require('./authenticate').authenticate;
const User = require('./models/user.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(registerRoutes);
const saltRounds = Number(process.env.SALT_ROUNDS);

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });


app.get('/profile', authenticate, (req, res) => {
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

app.get('/profile/followers', authenticate, (req, res) => {
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

app.delete('/profile/followers', authenticate, (req, res) => {
    const username = req.query.username || req.body.username
    res.redirect(307, '/profile/followers/' + username);
});

app.delete('/profile/followers/:username', authenticate, (req, res) => {
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

app.patch('/follow', authenticate, (req, res) => {
    const username = req.query.username || req.body.username
    res.redirect(307, '/follow/' + username);
});

app.patch('/follow/:username', authenticate, (req, res) => {
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

app.get('/feed', authenticate, (req, res) => {
    const username = req.body.username;
    User.findOne({ username: username }, (err, storedUser) => {
        if (!err) {
            if (!storedUser) {
                res.status(404).json({
                    message: 'User not found'
                });
            } else {
                const storedUserFollowing = storedUser.following;
                res.status(200).json({
                    message: 'user feed found',
                    posts: storedUserFollowing
                })
            }

        }
    });
});


app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

module.exports = { app };