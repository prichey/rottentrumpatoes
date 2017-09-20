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
require('./lib/approval').init();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log('Server running on port ' + port);
});

if (process.env.NODE_ENV === 'dev') {
  io.sockets.on('connection', socket => {
    socket.on('join', data => {
      socket.join(data.uuid); // join client room to transmit data to
    });
  });

  app.use('/scrape', require('./routes/scrape'));
  app.use('/movies', require('./routes/movieList'));
}

app.use('/', require('./routes/index'));
app.use('*', (req, res) => {
  res.redirect('/');
});
