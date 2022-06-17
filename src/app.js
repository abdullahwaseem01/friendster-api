require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const authenticate = require('./authenticate').authenticate;
const generateToken = require('./authenticate').generateToken;
const User = require('./models/user.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
const saltRounds = Number(process.env.SALT_ROUNDS);

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });


app.post('/register', (req, res) => {
    const { username, email, password, name, age, avatar, profileStatus } = req.body;
    const token = generateToken(username, email, name, age, avatar, profileStatus);
    const refreshToken = jwt.sign({ username, email, name, age, avatar, profileStatus }, process.env.JWT_REFRESH_SECRET);
    bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (!err) {
            const password = await hash;
            const user = new User({ username, email, password, name, age, avatar, profileStatus, token, refreshToken });
            user.save((error) => {
                if (!error) {
                    res.status(200).json({
                        message: 'User created successfully',
                        token: token,
                        refreshToken: refreshToken
                    });
                } else {
                    res.status(400).json({
                        message: 'Error creating user',
                        error: error
                    });
                }
            });
        } else {
            res.status(500).json({
                message: 'Error hashing password',
                error: err
            });
        }

    });

});

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
                for(indexFollowerID of followersIDs){
                    const indexedFollower = await User.findById(indexFollowerID);
                    followersArray.push(indexedFollower);
                }
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
    User.findOne({ username: requestedUsername }, async (err, requestedUser) => {
        if (!err) {
            if (!requestedUser) {
                res.status(404).json({
                    message: 'Requested user not found'
                });
            }
            else {
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


app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});