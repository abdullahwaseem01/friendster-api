const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');

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
        required: true,
        validate: {
            validator: (token) => {
                if (!validator.isJWT(token)) {
                    throw new Error('Invalid token');
                }
            }
        }

    },
    refreshToken: {
        type: String,
        trim: true,
        unique: true,
        required: true,
        validate: {
            validator: (token) => {
                if (!validator.isJWT(token)) {
                    throw new Error('Invalid token');
                }
            }
        }
    }

});

module.exports = mongoose.model('User', userSchema);