const express = require('express')
const router = express.Router()
const ejs = require('ejs')
const db = require('./db')
const session = require('express-session')
const passwdRegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

// login oldal betöltése
router.get('/login', (req, res) => {
    ejs.renderFile('./views/users/login.ejs', { session: req.session }, (err, html) => {
        if (err) {
            console.log(err)
            return
        }
        req.session.error = ''
        req.session.body = null
        res.send(html)
    })
})

// regisztráció oldal betöltése
router.get('/registration', (req, res) => {
    ejs.renderFile('./views/users/registration.ejs', { session: req.session }, (err, html) => {
        if (err) {
            console.log(err)
            return
        }
        req.session.error = ''
        req.session.body = null
        res.send(html)
    })
})

// regisztráció
router.post('/registration', (req, res) => {
    let { name, email, password, confirm } = req.body

    if (name == '' || email == '' || password == '' || confirm == '') {
        req.session.error = 'nem adtál meg minden adatot'
        req.session.severity = 'danger'
        return res.redirect('/users/registration')
    }

    if (password != confirm) {
        req.session.error = 'nem egyeznek a jelszavak'
        req.session.severity = 'danger'
        return res.redirect('/users/registration')
    }

    if (!password.match(passwdRegExp)) {
        req.session.error = 'nem elég biztonságos a jelszó'
        req.session.severity = 'danger'
        return res.redirect('/users/registration')
    }

    db.query(`SELECT * FROM users WHERE email=?`, [email], (err, results) => {
        if (err) {
            req.session.error = 'adatbázis hiba'
            req.session.severity = 'danger'
            return res.redirect('/users/registration')
        }

        if (results.length != 0) {
            req.session.error = 'van már ilyen email címmel regisztrált felhasználó'
            req.session.severity = 'danger'
            return res.redirect('/users/registration')
        }

        db.query(`INSERT INTO users (name, email, password) VALUES (?, ?, SHA1(?))`, [name, email, password], (err, results) => {
            if (err) {
                req.session.error = 'adatbázis hiba'
                req.session.severity = 'danger'
                return res.redirect('/users/registration')
            }
            req.session.error = 'sikeres regisztráció'
            req.session.severity = 'success'
            return res.redirect('/users/login')
        })
    })
})

// login
router.post('/login', (req, res) => {
    let { email, password } = req.body

    if (email == '' || password == '') {
        req.session.error = 'nem adtál meg minden adatot'
        req.session.severity = 'danger'
        return res.redirect('/users/login')
    }

    db.query(`SELECT * FROM users WHERE email=? AND password=SHA1(?)`, [email, password], (err, results) => {
        if (err) {
            req.session.error = 'adatbázis hiba'
            req.session.severity = 'danger'
            return res.redirect('/users/login')
        }

        if (results.length == 0) {
            req.session.error = 'hibás belépési adatok'
            req.session.severity = 'danger'
            return res.redirect('/users/login')
        }

        req.session.user = results[0]
        res.redirect('/steps')
    })
})

// logout
router.get('/logout', (req, res) => {
    req.session.user = null
    res.redirect('/users/login')
})

module.exports = router