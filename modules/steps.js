const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const db = require('./db');
var moment = require('moment');
const session = require('express-session');

// lépések oldal betöltése
router.get('/', (req, res) => {
    ejs.renderFile('./views/steps/steps.ejs', { session: req.session }, (err, html) => {
        if (err) {
            console.log(err)
            return;
        }

        res.send(html)
    })
})

module.exports = router;