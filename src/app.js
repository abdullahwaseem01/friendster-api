require('dotenv').config();
require('./database/db.js');
const express = require('express');

const bodyParser = require('body-parser');

const registerRoutes = require('./routes/register.js');
const profileRoutes = require('./routes/profile.js');
const authenticate = require('./authentication/authenticate.js').authenticate;
const User = require('./models/user.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(registerRoutes);
app.use(profileRoutes);



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
                });
            }

        }
    });
});


app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

module.exports = { app };