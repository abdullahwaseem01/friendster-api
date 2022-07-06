require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/user.js');

async function authenticate(req, res, next) {
    const post = {
        title: req.body.title || req.query.title,
        content: req.body.content|| req.query.content,
        caption: req.body.caption || req.query.caption,
    };
    const postId = req.body.postId || req.query.postId;
    const userUpdate = req.body || req.query;
    let token = req.query.token || req.body.token || req.headers['authorization'];
    if (token && token === req.headers['authorization']) {
        token = await token.split(' ')[1];
    }
    if (!token) {
        res.status(400).json({
            message: 'No token provided'
        });
    } else {
        jwt.verify(token, process.env.JWT_SECRET, (err, result) => {
            if (err) {
                jwt.verify(token, process.env.JWT_REFRESH_SECRET, async (err, user) => {
                    if (err) {
                        res.status(401).json({
                            message: 'invalid token',
                            error: err
                        });
                    } else {
                        User.findOne({ refreshToken: token }, async (err, user) => {
                            if (!err && user) {
                                const newToken = await generateToken(user.username, user.email, user.name, user.age, user.avatar, user.profileStatus);
                                user.token = newToken;
                                user.save((error) => {
                                    if (error) {
                                        res.status(503).json({
                                            message: 'Error saving token',
                                            error: error
                                        });
                                    } else {
                                        res.status(201).json({
                                            message: 'Token refreshed',
                                            token: newToken
                                        });
                                    }
                                });
                            } else {
                                res.status(401).json({
                                    message: 'Invalid token'
                                });
                            }
                        });
                    }

                });
            } else {
                if (req.originalUrl.includes('/post')) {
                    if (req.method === 'DELETE') {
                        req.body = {
                            user: result,
                            postId: postId,
                        }
                        next();
                    } else if(req.method === 'PATCH') {
                        req.body ={
                            user: result,
                            postId: postId,
                            post: post
                        }
                        next();
                    }
                    else {
                        req.body = {
                            user: result,
                            post: post
                        }
                        next();
                    }
                }  else if(req.originalUrl ==='/profile' && req.method === 'PATCH') {
                    req.body = {
                        user: result,
                        userUpdate: userUpdate
                    }
                    next();

                }else {
                    req.body = result;
                    next();
                }
            }
        });
    }
}

function generateToken(username, email, name, age, avatar, profileStatus) {
    return jwt.sign({ username, email, name, age, avatar, profileStatus }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
}


module.exports = { authenticate, generateToken };