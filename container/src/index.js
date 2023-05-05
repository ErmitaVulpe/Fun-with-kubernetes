const express = require('express');
const app = express();
const os = require('os');
const mysql = require('mysql');

// Create a MySQL connection
const connection = mysql.createConnection({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE
});

// Connect to the MySQL server
connection.connect(function (err) {
    if (err) throw err;
    console.log('Connected to MySQL server');

    // Check if the logs table exists and create it if it doesn't
    connection.query('CREATE TABLE IF NOT EXISTS logs (id INT AUTO_INCREMENT PRIMARY KEY, time VARCHAR(255), hostname VARCHAR(255))', function (err, result) {
        if (err) throw err;
        console.log('Created logs table');
    });
});

// Handle GET requests to the root URL
app.get('/', function (req, res) {
    // Get the hostname of the machine
    const hostname = os.hostname();

    // Get the current time
    const now = new Date();

    // Insert the current time and hostname into the logs table
    connection.query(`INSERT INTO logs (time, hostname) VALUES ('${now}', '${hostname}')`, function (err, result) {
        if (err) throw err;
        console.log(`Inserted record with time ${now} and hostname ${hostname}`);
    });

    // Send a response with the hostname
    res.send(`Connected to ${hostname}`);
});

// Start the server on port 3000
app.listen(3000, function () {
    console.log('Server started on port 3000');
});