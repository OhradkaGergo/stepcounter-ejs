var mysql = require('mysql')
var pool = mysql.createPool({
    host            : process.env.DBHOST,
    database        : process.env.DBNAME,
    user            : process.env.DBUSER,
    password        : process.env.DBPASS,
    connectionLimit : 10
})

pool.getConnection((err) => {
    if (err) {
        console.log('connection error: ' + err)
    } else {
        console.log('connected to mysql database')
    }
})

module.exports = pool