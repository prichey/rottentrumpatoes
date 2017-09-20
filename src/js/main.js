const throttle = require('throttle-debounce/throttle');

const $window = $(window);

const $approvalCopy = $('#approval-copy');
const $poster = $('#poster');

const $shareButton = $('#share-link');
const $whoButton = $('#who-link');
const $whatButton = $('#what-link');
const $closeSectionButton = $('.section-close');
const $mainContent = $('.main-content');

function hookUpEscapeClose() {
  $(document).keyup(function(e) {
    // escape key
    if (e.keyCode == 27) {
      closeActiveModals();
    }
  });
}

function closeActiveModals() {
  $('.nav-sections li.active').removeClass('active');
  $('.nav-links li.active').removeClass('active');
  $mainContent.removeClass('nopacity');
}

function hookUpShareButtonClick() {
  $shareButton.on('click tap touch', e => {
    e.preventDefault();

    console.log('share');
    const $shareLink = $(`[data-section-link='share']`);
    const $shareSection = $(`[data-section='share']`);

    if ($(`[data-section-link='share']`).hasClass('active') !== true) {
      closeActiveModals();
      $shareLink.addClass('active');
      $shareSection.addClass('active');
      $mainContent.addClass('nopacity');
    } else {
      closeActiveModals();
    }
  });

  return;
}

function hookUpWhoButtonClick() {
  $whoButton.on('click tap touch', function(e) {
    e.preventDefault();

    console.log('who');
    const $whoLink = $(`[data-section-link='who']`);
    const $whoSection = $(`[data-section='who']`);

    if ($(`[data-section-link='who']`).hasClass('active') !== true) {
      closeActiveModals();
      $whoLink.addClass('active');
      $whoSection.addClass('active');
      $mainContent.addClass('nopacity');
    } else {
      closeActiveModals();
    }
  });

  return;
}

function hookUpWhatButtonClick() {
  $whatButton.on('click tap touch', function(e) {
    e.preventDefault();

    console.log('what');
    const $whatLink = $(`[data-section-link='what']`);
    const $whatSection = $(`[data-section='what']`);

    if ($(`[data-section-link='what']`).hasClass('active') !== true) {
      closeActiveModals();
      $whatLink.addClass('active');
      $whatSection.addClass('active');
      $mainContent.addClass('nopacity');
    } else {
      closeActiveModals();
    }
  });

  return;
}

function hookUpCloseButtonClick() {
  $closeSectionButton.on('click tap touch', function(e) {
    e.preventDefault();
    closeActiveModals();
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
  hookUpEscapeClose();
}

$(window).on('load', () => {
  run();
  $('.main-content').removeClass('nopacity');
});

window.onresize = throttle(250, () => {
  fixApprovalCopyHeight();
});
