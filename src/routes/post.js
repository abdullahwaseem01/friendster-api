const express = require('express');
const router = express.Router();
const validator = require('validator');
const authenticate = require('../authentication/authenticate.js').authenticate;
const User = require('../models/user.js');
const Post = require('../models/post.js');
const { findOneAndDelete } = require('../models/user.js');

router.post('/post', authenticate, (req, res) => {
    const username = req.body.user.username;
    const post = req.body.post;
    User.findOneAndUpdate({ username: username }, { $push: { posts: post } }, { new: true }, (error, user) => {
        if (!error) {
            res.status(200).json({
                message: 'Post created successfully',
                post: post
            });
        } else {
            res.status(400).json({
                message: 'Error creating post',
                error: error
            });
        }
    }
    );
});

router.delete('/post', authenticate, (req, res) => {
    const username = req.body.user.username;
    const postId = req.body.postId;
    if (!validator.isMongoId(postId)) {
        res.status(400).json({
            message: 'Invalid post id'
        });
    } else{
        User.findOneAndUpdate({ username: username }, { $pull: { posts: { _id: postId } } }, { new: true }, (error, user) => {
            if (!error) {
                res.status(200).json({
                    message: 'Post deleted successfully'
                });
            } else {
                res.status(500).json({
                    message: 'Error deleting post',
                    error: error
                });
            }
        }
        );
    }
});

module.exports = router;