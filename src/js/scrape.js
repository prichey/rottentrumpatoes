const io = require('./io');
const socket = io.socket;
const moment = require('moment');

const $log = $('ul.log');
const $htmlBody = $('html, body');

function formatDataLog(str) {
  return `<li><span class='date'>[${moment().format(
    'MM/DD/YY HH:mm:ss'
  )}]</span> <span class='data'>${str}</span></li>`;
}

function scrollToBottom() {
  $htmlBody.stop(); // stop current animation, if any
  $htmlBody.animate({ scrollTop: $(document).height() });
}

function run() {
  io.init();
  socket.on('new_msg', function(data) {
    $log.append(formatDataLog(data.msg));
    scrollToBottom();
  });
  console.log('scrape');
}

$(window).on('load', function() {
  run();
});
