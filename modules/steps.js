const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const db = require('./db');
var moment = require('moment');
const session = require('express-session');

// steps lista
router.get('/', loginCheck, (req, res) => {
    db.query(
        `SELECT * FROM steps WHERE user_id=? ORDER BY date DESC`,
        [req.session.user.id],
        (err, results) => {
            if (err) {
                console.log(err)
                req.session.error = 'Adatbázis hiba!'
                req.session.severity = 'danger'
                return res.redirect('/steps')
            }

            results.forEach(item => {
                const d = new Date(item.date)
                item.date = `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`
            })

            ejs.renderFile(
                './views/steps/steps.ejs',
                {
                    session: req.session,
                    steps: results
                },
                (err, html) => {
                    if (err) {
                        console.log(err)
                        return
                    }
                    req.session.error = ''
                    req.session.body = null
                    res.send(html)
                }
            )
        }
    )
})

// új steps űrlap
router.get('/new', loginCheck, (req, res) => {
    ejs.renderFile('./views/steps/steps-new.ejs', { session: req.session }, (err, html) => {
        if (err) {
            console.log(err)
            return
        }
        req.session.error = ''
        req.session.body = null
        res.send(html)
    })
})

// új steps
router.post('/new', loginCheck, (req, res) => {
    let { steps, date } = req.body
    const today = new Date().toISOString().split('T')[0]

    req.session.body = req.body

    if (steps == '' || date == '') {
        req.session.error = 'Nem adtál meg minden kötelező adatot'
        req.session.severity = 'danger'
        return res.redirect('/steps/new')
    }

    if (parseInt(steps) <= 0) {
        req.session.error = 'A lépések száma pozitív kell legyen'
        req.session.severity = 'danger'
        return res.redirect('/steps/new')
    }

    if (date > today) {
        req.session.error = 'Nem vehetsz fel lépést jövőbeli dátumra'
        req.session.severity = 'danger'
        return res.redirect('/steps/new')
    }

    db.query(
        `SELECT id FROM steps WHERE user_id=? AND date=?`,
        [req.session.user.id, date],
        (err, results) => {
            if (err) {
                console.log(err)
                req.session.error = 'Adatbázis hiba!'
                req.session.severity = 'danger'
                return res.redirect('/steps/new')
            }

            if (results.length > 0) {
                req.session.error = 'Erre a dátumra már rögzítettél lépéseket'
                req.session.severity = 'warning'
                return res.redirect('/steps/new')
            }

            db.query(
                `INSERT INTO steps (user_id, date, steps)
                 VALUES (?, ?, ?)`,
                [req.session.user.id, date, steps],
                (err, results) => {
                    if (err) {
                        console.log(err)
                        req.session.error = 'Adatbázis hiba!'
                        req.session.severity = 'danger'
                        return res.redirect('/steps')
                    }

                    req.session.error = 'Lépések sikeresen rögzítve!'
                    req.session.severity = 'success'
                    return res.redirect('/steps')
                }
            )
        }
    )
})

// frissít steps űrlap
router.get('/edit/:id', loginCheck, (req, res) => {
    const id = req.params.id

    db.query(
        `SELECT * FROM steps WHERE id=? AND user_id=?`,
        [id, req.session.user.id],
        (err, results) => {
            if (err) {
                console.log(err)
                req.session.error = 'Adatbázis hiba!'
                req.session.severity = 'danger'
                return res.redirect('/steps')
            }

            if (results.length === 0) {
                req.session.error = 'Nincs jogosultságod ehhez a lépéshez'
                req.session.severity = 'danger'
                return res.redirect('/steps')
            }

            const step = results[0]
            const d = step.date
            step.date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

            ejs.renderFile(
                './views/steps/steps-edit.ejs',
                {
                    session: req.session,
                    step: results[0]
                },
                (err, html) => {
                    if (err) {
                        console.log(err)
                        return
                    }
                    req.session.error = ''
                    req.session.body = null
                    res.send(html)
                }
            )
        }
    )
})

// frissít steps
router.post('/edit/:id', loginCheck, (req, res) => {
    const { steps, date } = req.body
    const id = req.params.id
    const today = new Date().toISOString().split('T')[0]

    if (steps === '' || date === '') {
        req.session.error = 'Nem adtál meg minden kötelező adatot'
        req.session.severity = 'danger'
        return res.redirect('/steps/edit/' + id)
    }

    if (parseInt(steps) <= 0) {
        req.session.error = 'A lépések száma pozitív kell legyen'
        req.session.severity = 'danger'
        return res.redirect('/steps/edit/' + id)
    }

    if (date > today) {
        req.session.error = 'Nem vehetsz fel lépést jövőbeli dátumra'
        req.session.severity = 'danger'
        return res.redirect('/steps/edit/' + id)
    }

    db.query(
        `SELECT id FROM steps
         WHERE user_id=? AND date=? AND id!=?`,
        [req.session.user.id, date, id],
        (err, results) => {
            if (err) {
                console.log(err)
                req.session.error = 'Adatbázis hiba!'
                req.session.severity = 'danger'
                return res.redirect('/steps')
            }

            if (results.length > 0) {
                req.session.error = 'Erre a dátumra már létezik másik bejegyzés'
                req.session.severity = 'warning'
                return res.redirect('/steps/edit/' + id)
            }

            db.query(
                `UPDATE steps
                 SET steps=?, date=?
                 WHERE id=? AND user_id=?`,
                [steps, date, id, req.session.user.id],
                (err, results) => {
                    if (err) {
                        console.log(err)
                        req.session.error = 'Adatbázis hiba!'
                        req.session.severity = 'danger'
                        return res.redirect('/steps')
                    }

                    req.session.error = 'Lépés sikeresen módosítva!'
                    req.session.severity = 'success'
                    return res.redirect('/steps')
                }
            )
        }
    )
})

// töröl steps űrlap
router.get('/delete/:id', loginCheck, (req, res) => {
    const id = req.params.id

    db.query(
        `SELECT * FROM steps WHERE id=? AND user_id=?`,
        [id, req.session.user.id],
        (err, results) => {
            if (err) {
                console.log(err)
                req.session.error = 'Adatbázis hiba!'
                req.session.severity = 'danger'
                return res.redirect('/steps')
            }

            if (results.length === 0) {
                req.session.error = 'Nincs jogosultságod ehhez a lépéshez'
                req.session.severity = 'danger'
                return res.redirect('/steps')
            }

            const step = results[0]

            // dátum formázás a date inputhoz (timezone-safe)
            const d = step.date
            step.date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

            ejs.renderFile(
                './views/steps/steps-delete.ejs',
                {
                    session: req.session,
                    step
                },
                (err, html) => {
                    if (err) {
                        console.log(err)
                        return
                    }
                    req.session.error = ''
                    req.session.body = null
                    res.send(html)
                }
            )
        }
    )
})

// töröl steps
router.post('/delete/:id', loginCheck, (req, res) => {
    const id = req.params.id

    db.query(
        `DELETE FROM steps WHERE id=? AND user_id=?`,
        [id, req.session.user.id],
        (err, results) => {
            if (err) {
                console.log(err)
                req.session.error = 'Adatbázis hiba!'
                req.session.severity = 'danger'
                return res.redirect('/steps')
            }

            req.session.error = 'Lépés sikeresen törölve!'
            req.session.severity = 'success'
            return res.redirect('/steps')
        }
    )
})

// login check
function loginCheck(req, res, next){
    if (req.session.user){
        return next()
    }
    return res.redirect('/users/login')
}

module.exports = router;