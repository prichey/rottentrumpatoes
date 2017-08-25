const axios = require('axios');

function hookupDeleteMovieButtons() {
  $('.delete-movie').on('click tap touch', function(e) {
    e.preventDefault();

    const $parent = $(this).closest('tr');
    const id = $parent.attr('data-id');
    const rating = $parent.attr('data-rt-rating');

    if (!!id) {
      axios
        .delete(`/movies/${id}`, {
          params: {
            rating: rating
          }
        })
        .then(res => {
          $parent.remove();
        })
        .catch(err => {
          console.log(err);
        });
    }
  });
}

function run() {
  hookupDeleteMovieButtons();
}

$(window).on('load', function() {
  run();
});
