const express = require('express');
const router = express.Router();
const validator = require('validator');
const authenticate = require('../authentication/authenticate.js').authenticate;
const User = require('../models/user.js');
const Post = require('../models/post.js');

router.post('/post', authenticate, (req, res) => {
    const username = req.body.user.username;
    const post = req.body.post;
    // find user inject server-side post schema data and to user posts array
});

router.delete('/post', authenticate, (req, res) => {
    const username = req.body.user.username;
    const postId = req.body.postId;
    if (!validator.isMongoId(postId)) {
        res.status(400).json({
            message: 'Invalid post id'
        });
    } else{
        //find post by id and delete
    }
});

module.exports = router;