const mysql = require('mysql');

const connection = mysql.createConnection({
    host: '',
    user: '',
    password: '',
    database: ''
});

connection.query('SELECT * FROM logs', function (error, results, fields) {
    if (error) throw error;
    console.log(results);
});

connection.end();