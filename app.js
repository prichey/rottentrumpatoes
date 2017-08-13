require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const path = require('path');

require('./lib/trump')();
// require('./lib/movie')();

const index = require('./routes/index');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Server running on port ' + port);
});

app.use('/', index);
app.use('*', function(req, res) {
  res.redirect('/');
});

module.exports = app;
