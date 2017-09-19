const throttle = require('throttle-debounce/throttle');

const $window = $(window);

const $approvalCopy = $('#approval-copy');
const $poster = $('#poster');

const $shareButton = $('#share-link');
const $whoButton = $('#who-link');
const $whatButton = $('#what-link');
const $closeSectionButton = $('.section-close');
const $mainContent = $('.main-content');

function hookUpShareButtonClick() {
  $shareButton.on('click tap touch', e => {
    e.preventDefault();
    console.log('share');
  });

  return;
}

function hookUpWhoButtonClick() {
  $whoButton.on('click tap touch', e => {
    e.preventDefault();
    console.log('who');
    $('.nav-links li.active').removeClass('active');
    $(`[data-section-link='who']`).addClass('active');
    $('.nav-sections li.active').removeClass('active');
    $(`[data-section='who']`).addClass('active');
    $mainContent.addClass('nopacity');
  });

  return;
}

function hookUpWhatButtonClick() {
  $whatButton.on('click tap touch', e => {
    e.preventDefault();
    console.log('what');
    $('.nav-links li.active').removeClass('active');
    $(`[data-section-link='what']`).addClass('active');
    $('.nav-sections li.active').removeClass('active');
    $(`[data-section='what']`).addClass('active');
    $mainContent.addClass('nopacity');
  });

  return;
}

function hookUpCloseButtonClick() {
  $closeSectionButton.on('click tap touch', e => {
    e.preventDefault();
    $('.nav-sections li.active').removeClass('active');
    $('.nav-links li.active').removeClass('active');
    $mainContent.removeClass('nopacity');
  });
}

function hookUpButtonsClick() {
  hookUpShareButtonClick();
  hookUpWhoButtonClick();
  hookUpWhatButtonClick();
  hookUpCloseButtonClick();
  return;
}

function fixApprovalCopyHeight() {
  if ($window.width() > 1000) {
    const posterHeight = $poster.height();
    $approvalCopy.height(posterHeight);
  } else {
    $approvalCopy.height('auto');
  }
}

function run() {
  fixApprovalCopyHeight();
  hookUpButtonsClick();
}

$(window).on('load', () => {
  run();
  $('.main-content').removeClass('nopacity');
});

window.onresize = throttle(250, () => {
  fixApprovalCopyHeight();
});
