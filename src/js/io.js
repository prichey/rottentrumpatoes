const io = require('socket.io-client');
export let socket = io();
const uuid = require('uuid/v1')(); // v1 UUID (time-based)

export function init() {
  // socket.emit('join', { uuid: uuid });
  socket.emit('join', { uuid: 'foo' });
}
