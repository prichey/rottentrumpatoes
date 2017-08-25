const low = require('lowdb');
const approvalDb = low('./approval.json');
const moviesDb = low('./movies.json');

function setup() {
  approvalDb.defaults({}).write();
  moviesDb.defaults(getPlaceholderObj()).write();
}

function getPlaceholderObj() {
  let returnObj = { allMovies: [], excludedMovies: [] };

  for (let i = 0; i <= 100; i++) {
    returnObj[i] = [];
  }

  return returnObj;
}

exports.init = () => {
  setup();
};
