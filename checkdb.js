const mysql = require('mysql');

const connection = mysql.createConnection({
    host: '10.58.144.3',
    user: 'user',
    password: 'M9I}[6@;eP~~/K(J',
    database: 'connection-logs'
});

connection.query('SELECT * FROM logs', function (error, results, fields) {
    if (error) throw error;
    console.log(results);
});

connection.end();