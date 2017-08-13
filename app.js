require('dotenv').config();

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
exports.io = io;

const bodyParser = require('body-parser');
const path = require('path');
const low = require('lowdb');

require('./lib/db').init();

const index = require('./routes/index');
const scrape = require('./routes/scrape');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
http.listen(port, function() {
  console.log('Server running on port ' + port);
});

io.sockets.on('connection', function(socket) {
  socket.on('join', function(data) {
    socket.join(data.uuid); // join client room to transmit data to
  });
});

app.use('/', index);
app.use('/scrape', scrape);
app.use('*', function(req, res) {
  res.redirect('/');
});
