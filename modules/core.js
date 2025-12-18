const express = require('express')
const router = express.Router()
const ejs = require('ejs')
const db = require('./db')
const session = require('express-session')

router.get('/', (req, res) => {
    ejs.renderFile('./views/system/index.ejs', { session: req.session }, (err, html) => {
        if (err) {
            console.log(err)
            return
        }
        res.send(html)
    })
})

module.exports = router