const low = require('lowdb');
const approvalDb = low('db/approval.json');
const moviesDb = low('db/movies.json');

function setup() {
  approvalDb.defaults({}).write();
  moviesDb.defaults(getPlaceholderObj()).write();
}

function getPlaceholderObj() {
  let returnObj = { allMovies: [] };

  for (let i = 0; i <= 100; i++) {
    returnObj[i] = [];
  }

  return returnObj;
}

exports.init = () => {
  setup();
};
