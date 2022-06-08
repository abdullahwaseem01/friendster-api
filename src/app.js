require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const saltRounds = 10;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));


mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        data: Buffer,
        contentType: String
    },
    caption: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validator: (email) => {
            if (!validator.isEmail(email)) {
                throw new Error('Invalid email');
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    age: {
        type: Number,
        required: true,
        min: 0,
    },
    avatar: {
        data: Buffer,
        contentType: String
    },
    profileStatus: {
        type: String,
        required: true,
        trim: true,
        default: 'private'
    },
    requests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
    }],
    token: {
        type: String,
        trim: true,
        unique: true,
        validate: {
            validator: (token) => {
                if(!validator.isJWT(token)) {
                    throw new Error('Invalid token');
                }
            }
        }
                
    }, 
    refreshToken: {
        type: String,
        trim: true,
        unique: true,
        validate: {
            validator: (token) => {
                if(!validator.isJWT(token)) {
                    throw new Error('Invalid token');
                }
            }
        }
    }

});

const Post = mongoose.model('Post', postSchema);
const User = mongoose.model('User', userSchema);


app.post('/register', (req, res) => {
    const { username, email, password, name, age, avatar, profileStatus } = req.body;
    const token = generateToken(username, email, name, age, avatar, profileStatus);
    const refreshToken = jwt.sign({ username, email, name, age, avatar, profileStatus }, process.env.JWT_REFRESH_SECRET);
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (!err) {
            const password = hash;
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

app.get('/profile', (req, res) => {
    const username = req.query.username || req.body.username;
    const password = req.query.password || req.body.password;
    User.findOne({ username: username}, (err, storedUser) => {
        if(!err){
            if(!storedUser){
                res.status(404).json({
                    message: 'User not found'
                });
            } else {
                bcrypt.compare(password, storedUser.password, (error, results) => {
                    if (!error && results) {
                        const user = storedUser.toObject();
                        delete user.password;
                        res.status(200).json({
                            message: 'User found',
                            user: user
                        });
                    } else {
                        res.status(400).json({
                            message: 'Authentication failed',
                            error: error
                        });
                    }
                });
            }
        }
    });
});

app.get('/follow/:username', (req, res) => {
    const username = req.query.username || req.body.username;
    const password = req.query.password || req.body.password;
    const followingRequest = req.params.username;
    
});

app.post('/test', authToken, (req, res) => { 
    res.status(200).json({
        user: req.body
    });
});

async function authToken(req, res, next) {
    let token = req.query.token || req.body.token || req.headers['authorization'];
    if (token === req.headers['authorization']) {
        token = await token.split(' ')[1];
    }

    if(!token) {
        res.status(401).json({
            message: 'No token provided'
        });
    } else {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if(!err) {
                req.body = user;
                next();
            } else {
                res.status(403).json({
                    message: 'Invalid token'
                });
            }
        });
    }
}

function generateToken(username, email, name, age, avatar, profileStatus ) {
    return jwt.sign({ username, email, name, age, avatar, profileStatus }, process.env.JWT_SECRET, { expiresIn: '1m' });
}

app.get('/token', async (req, res) => {
    let token = req.query.token || req.body.token || req.headers['authorization'];
    if (token === req.headers['authorization']) {
        token = await token.split(' ')[1];
    }
    if(!token) {
        res.status(401).json({
            message: 'No token provided'
        });
    } else {
        User.findOne({ refreshToken: token }, async (err, user) => {
            if(!err && user) {
                const newToken = generateToken(user.username, user.email, user.name, user.age, user.avatar, user.profileStatus);
                user.token = newToken;
                await user.save((error) => {
                    if (error){
                        res.status(500).json({
                            message: 'Error saving token',
                            error: error
                        });
                    } else {
                        res.status(200).json({
                            message: 'Token refreshed',
                            token: newToken
                        });
                    }
                });
            } else {
                res.status(400).json({
                    message: 'Invalid token'
                });
            }
        });
    }

});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});