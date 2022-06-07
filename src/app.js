require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
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

});

const Post = mongoose.model('Post', postSchema);
const User = mongoose.model('User', userSchema);

//use multer to storage the image in the database using the post schema


app.post('/register', (req, res) => {
    const { username, email, password, name, age, avatar } = req.body;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (!err) {
            const password = hash;
            const user = new User({ username, email, password, name, age, avatar });
            user.save((error) => {
                if (!error) {
                    res.status(200).json({
                        message: 'User created successfully',
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

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});