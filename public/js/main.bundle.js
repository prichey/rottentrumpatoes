!function t(e,n,o){function i(c,r){if(!n[c]){if(!e[c]){var s="function"==typeof require&&require;if(!r&&s)return s(c,!0);if(a)return a(c,!0);var l=new Error("Cannot find module '"+c+"'");throw l.code="MODULE_NOT_FOUND",l}var u=n[c]={exports:{}};e[c][0].call(u.exports,function(t){var n=e[c][1][t];return i(n||t)},u,u.exports,t,e,n,o)}return n[c].exports}for(var a="function"==typeof require&&require,c=0;c<o.length;c++)i(o[c]);return i}({1:[function(t,e,n){e.exports=function(t,e,n,o){function i(){function i(){c=Number(new Date),n.apply(s,u)}function r(){a=void 0}var s=this,l=Number(new Date)-c,u=arguments;o&&!a&&i(),a&&clearTimeout(a),void 0===o&&l>t?i():!0!==e&&(a=setTimeout(o?r:i,void 0===o?t-l:t))}var a,c=0;return"boolean"!=typeof e&&(o=n,n=e,e=void 0),i}},{}],2:[function(t,e,n){"use strict";function o(){h.on("click tap touch",function(t){t.preventDefault(),console.log("share")})}function i(){p.on("click tap touch",function(t){t.preventDefault(),console.log("who"),$(".nav-links li.active").removeClass("active"),$("[data-section-link='who']").addClass("active"),$(".nav-sections li.active").removeClass("active"),$("[data-section='who']").addClass("active"),C.addClass("nopacity")})}function a(){w.on("click tap touch",function(t){t.preventDefault(),console.log("what"),$(".nav-links li.active").removeClass("active"),$("[data-section-link='what']").addClass("active"),$(".nav-sections li.active").removeClass("active"),$("[data-section='what']").addClass("active"),C.addClass("nopacity")})}function c(){m.on("click tap touch",function(t){t.preventDefault(),$(".nav-sections li.active").removeClass("active"),$(".nav-links li.active").removeClass("active"),C.removeClass("nopacity")})}function r(){o(),i(),a(),c()}function s(){if(v.width()>1e3){var t=d.height();f.height(t)}else f.height("auto")}function l(){s(),r()}var u=t("throttle-debounce/throttle"),v=$(window),f=$("#approval-copy"),d=$("#poster"),h=$("#share-link"),p=$("#who-link"),w=$("#what-link"),m=$(".section-close"),C=$(".main-content");$(window).on("load",function(){l(),$(".main-content").removeClass("nopacity")}),window.onresize=u(250,function(){s()})},{"throttle-debounce/throttle":1}]},{},[2]);
//# sourceMappingURL=maps/main.bundle.js.map
