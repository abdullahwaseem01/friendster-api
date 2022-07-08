const express = require('express');
const router = express.Router();
const validator = require('validator');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const authenticate = require('../authentication/authenticate.js').authenticate;
const User = require('../models/user.js');
const Post = require('../models/post.js');

router.get('/post', authenticate, (req, res) => {
    const username = req.body.user.username;
    User.findOne({ username: username }, async (err, storedUser) => {
        if (!err) {
            if (!storedUser) {
                res.status(404).json({
                    message: 'User found'
                });
            } else {
                const postIDs = storedUser.posts;
                let postsArray = [];
                for (const indexPostID of postIDs) {
                    const indexedPost = await Post.findById(indexPostID);
                    const indexedPostClean = indexedPost.toObject();
                    delete indexedPostClean.owner;
                    postsArray.push(indexedPostClean);

                }
                res.status(200).json({
                    Posts: postsArray
                });

            }

        }
    });

});

router.post('/post', authenticate, async (req, res) => {
    const username = req.body.user.username;
    const post = req.body.post;
    console.log();
    if (!post.content || (!_.toLower(post.content).endsWith('.jpg') && !_.toLower(post.content).endsWith('.png') && !_.toLower(post.content).endsWith('.jpg'))) {
        res.status(400).json({ message: 'Post content is required to be a valid image file name' });
    } else {
        try {
            const image = await fs.readFileSync(path.join(__dirname, '..', '..', post.content));
            User.findOne({ username: username }, (err, user) => {
                if (!err) {
                    const newPost = new Post({ title: post.title, content: image, caption: post.caption, createdAt: Date.now(), owner: user._id });
                    newPost.save((err, post) => {
                        if (!err) {
                            user.posts.push(post._id);
                            user.save(async (err, user) => {
                                if (!err) {
                                    let cleanPost = post.toObject();
                                    const cleanedUser = await user.toObject();
                                    delete cleanedUser.password;
                                    delete cleanedUser.refreshToken;
                                    delete cleanedUser.token;
                                    delete cleanedUser.requests;
                                    cleanPost.owner = cleanedUser;
                                    res.status(201).json({
                                        message: 'Post created',
                                        post: cleanPost
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
        } catch (err) {
            res.status(500).json({
                message: 'Error reading file',
                error: err
            });
        }

    }

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

router.patch('/post', authenticate, (req, res) => {
    const username = req.body.user.username;
    const postId = req.body.postId;
    const post = req.body.post;
    if (!post.content || (!_.toLower(post.content).endsWith('.jpg') && !_.toLower(post.content).endsWith('.png') && !_.toLower(post.content).endsWith('.jpg'))) {
        res.status(400).json({ message: 'Post content is required to be a valid image file name' });
    }
    else {
        try {
            User.findOne({ username: username }, async (err, user) => {
                const image = await fs.readFileSync(path.join(__dirname, '..', '..', post.content));
                post.content = image;
                if (user.posts.includes(postId)) {
                    const updatedPost = await Post.findOneAndUpdate({ _id: postId }, post, { new: true });
                    if (updatedPost) {
                        res.status(200).json({
                            message: 'Post updated successfully',
                            post: updatedPost
                        });
                    } else {
                        res.status(500).json({
                            message: 'Error updating post',
                            error: err
                        });
                    }
                } else {
                    res.status(404).json({
                        message: 'Post not found'
                    });
                }
            });
        } catch (err) {
            res.status(500).json({
                message: 'Error finding user',
                error: err
            });
        }
    }
});
module.exports = router;