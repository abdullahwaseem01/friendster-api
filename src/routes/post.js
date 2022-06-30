const express = require('express');
const router = express.Router();
const validator = require('validator');
const fs = require('fs');
const authenticate = require('../authentication/authenticate.js').authenticate;
const User = require('../models/user.js');
const Post = require('../models/post.js');

router.post('/post', authenticate, async (req, res) => {
    const username = req.body.user.username;
    const post = req.body.post;
    const image = await fs.readFileSync(post.content);
    User.findOne({ username: username }, (err, user) => {
        if (!err) {
            const newPost = new Post({ title: post.title, content: image, caption: post.caption, createdAt: Date.now(), owner: user._id });
            newPost.save((err, post) => {
                if (!err) {
                    user.posts.push(post._id);
                    user.save(async (err, user) => {
                        if (!err) {
                            //redefine the post object to filter data
                            const cleanedUser = user.toObject();
                            delete cleanedUser.password;
                            delete cleanedUser.refreshToken;
                            delete cleanedUser.token;
                            post.owner = await cleanedUser;
                            res.status(201).json({
                                message: 'Post created',
                                post: post
                            });
                        } else {
                            res.status(503).json({
                                message: 'Error saving post',
                                error: err
                            });

                        }
                    });
                }
                else {
                    res.status(503).json({
                        message: 'Error saving post',
                        error: err
                    });
                }
            });

        }
        else {
            res.status(500).json({
                message: 'Error finding user',
                error: err
            });
        }

    });

});

router.delete('/post', authenticate, (req, res) => {
    const username = req.body.user.username;
    const postId = req.body.postId;
    if (!validator.isMongoId(postId)) {
        res.status(400).json({
            message: 'Invalid post id'
        });
    } else {
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