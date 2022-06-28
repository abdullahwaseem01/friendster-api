require('dotenv').config();
require('./database/db.js');
const express = require('express');
const bodyParser = require('body-parser');

const registerRoutes = require('./routes/register.js');
const profileRoutes = require('./routes/profile.js');
const feedRoutes = require('./routes/feed.js');
const interactionsRoutes = require('./routes/interactions.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(registerRoutes);
app.use(feedRoutes);
app.use(profileRoutes);
app.use(interactionsRoutes);


app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

module.exports = app ;