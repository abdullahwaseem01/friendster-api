const express = require('express');
const router = express.Router();
const authenticate = require('../authentication/authenticate.js').authenticate;
const User = require('../models/user.js');
const Post = require('../models/post.js');

router.post('/post', authenticate, (req, res) => {
    const username = req.body.username;
    const post = req.body.post;
    //define post object 
});

router.delete('/post', authenticate, (req, res) => {
    const username = req.body.username;
    const postID = req.body.postID;
});
