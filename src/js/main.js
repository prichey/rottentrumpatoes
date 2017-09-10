const throttle = require('throttle-debounce/throttle');

const $window = $(window);

const $approvalCopy = $('#approval-copy');
const $poster = $('#poster');

function fixApprovalCopyHeight() {
  if ($window.width() > 1000) {
    const posterHeight = $poster.height();
    console.log(posterHeight);
    $approvalCopy.height(posterHeight);
  } else {
    $approvalCopy.height('auto');
  }
}

function run() {
  console.log('hi');
  fixApprovalCopyHeight();
}

$(window).on('load', () => {
  run();
  $('.main-content').removeClass('nopacity');
});

window.onresize = throttle(250, () => {
  fixApprovalCopyHeight();
});
