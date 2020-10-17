const { PORT_NUM } = require('./const.js');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');

exports.app = app;
exports.http = http;

require('./uploadAPI');

// if you want to serve the build from this server, you can do so by 
// uncommenting this line. For dev puroposes (taking advatage of hot reloading)
// we don't want to serve the build .
app.use(express.static(path.join(__dirname, '../build'), { index: 'index.html' }));

// listen for API requests
http.listen(PORT_NUM, () => {
	console.log(`App listening on port ${PORT_NUM}`);
});