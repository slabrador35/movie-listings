(() => {
  'use strict';
  let genrelabels = [];
  let movieholder = document.querySelector('#dbs-movies');

  /*
   * Show a (reasonably) friendly message to the user if we can't retrieve a json file
   */
  const handleLoadingError = (typ) => {
    movieholder.innerHTML = `<h2 class="loading-movies">Could not fetch ${typ} data. :(</h2>`;
  };

  /*
   * Request the json from 'src' and return a collection of movie or genre
   * objects as specified by 'typ'.
   */
  const loadJson = (src, typ) => {
    return new Promise(function(resolve, reject) {

      const reqObj = new XMLHttpRequest();
      reqObj.open('GET', src);
      reqObj.send();
      reqObj.onload = () => {
        if (reqObj.status >= 200 && reqObj.status < 300) {
          let datalist = JSON.parse(reqObj.responseText);

          if (typ === 'movie') datalist = datalist.results;
          else if (typ === 'genre') datalist = datalist.genres;
          else reject('unknown');

          resolve(datalist);
        } else {
          reject(typ);
        }
      };
    });
  };

  /*
   * Add a new array to each movie object that contains the genre labels
   */
  const combineGenreData = (movies, genres) => {
    movies.forEach((movie) => {
      // array of genres labels that we're going to add this this movie
      let genrelabelarray = [];

      movie.genre_ids.forEach((gen) => {
        // find the label for the ID in the movies' genre_ids
        let generename = genres.find(x => x.id === gen).name
        // and add that label to the local and global lists
        genrelabelarray.push(generename);
        genrelabels.push(generename);
      });

      // add the local list to the movie
      movie.genrefull = genrelabelarray;

    });

    // remove duplicates from the genre list
    genrelabels = [...new Set(genrelabels)];
    // and put the list in alphabetical order
    genrelabels = genrelabels.sort();

    return(movies);

  };

  /*
   * Utility function to add the movies to the #dbs-movies div
   */
  const displayMovies = (movieArray) => {
    let htmlcontent = '';
    movieArray.forEach((movie) => {
      htmlcontent += `<div class="singleMovie" data-rating="${movie.vote_average}">
                        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="" />
                        <h2>${movie.title} </h2>
                        <p>${movie.genrefull.join(', ')}</p>
                      </div>`;
    });
    movieholder.innerHTML = htmlcontent;
  };

  /*
   * Loop through all the genre labels and make a checkbox for each
   */
  const displayGenreCheckbs = () => {
    let checkboxHolder = document.querySelector('.genre-picker');
    genrelabels.forEach((genere) => {

      // make sure attr values don't have spaces
      let handle = genere.replace(' ', '-');
      // create new checkbox with label inside a div
      let checkdiv = document.createElement('div');
      let checkbox = document.createElement('input');
      let label = document.createElement('label')
      checkbox.type = 'checkbox';
      // checkbox.checked = "checked";
      checkbox.id = handle;
      checkbox.name = handle;
      checkbox.value = genere;
      label.htmlFor = handle;
      label.appendChild(document.createTextNode(genere));

      checkdiv.appendChild(checkbox);
      checkdiv.appendChild(label);
      checkboxHolder.appendChild(checkdiv);
    });
  };

  /*
   * Add the same event handler to all the genre checkboxes and ratings slider
   */
  const setupEventHandlers = () => {
    let genreCheckboxes = document.querySelectorAll('input[type=\'checkbox\']');
    let ratingslider = document.querySelector('#rating');

    genreCheckboxes.forEach((chk) => {
      chk.addEventListener('change', () => {
        filtermovies(genreCheckboxes, ratingslider);
      });
    });

    ratingslider.addEventListener('change', () => {
      filtermovies(genreCheckboxes, ratingslider);
    });
  };

  /*
   * Handle changes to the inputs - find the selected rating and
   * genres and then match them to each movie
   */
  const filtermovies = (genreCheckboxes, ratingslider) => {

    let themovies = movieholder.querySelectorAll('.singleMovie');
    // get the selected rating
    let selectedRating = ratingslider.value;
    let selectedGenres = [];
    let resultcount = 0;

    // show the selected rating to the user
    document.querySelector('.rating-output').innerText = selectedRating;

    // get the currently selected genres
    genreCheckboxes.forEach((thisBox) => {
      if (thisBox.checked) selectedGenres.push(thisBox.value);
    });

    // loop through the movies to see if each matches the selected rating and genres
    themovies.forEach((movie) => {
      // turn the genre labels back into an array
      let thismoviegs = movie.querySelector('p').innerText.split(', ');
      let thismovier = movie.dataset.rating;
      let gotagenre = true;

      // if there are no genres slected, show or hide the movie based on it's rating only
      if (selectedGenres.length < 1) {
        if (thismovier >= selectedRating) {
          resultcount++;
          movie.classList.remove('transition');
          movie.classList.remove('hide');
        } else {
          movie.classList.add('transition');
          setTimeout(() => {
            movie.classList.add('hide');
          }, 260);
        }
      // otherwise, see if the movie has all the selected genres...
      } else {
        selectedGenres.forEach((gen) => {
          if (thismoviegs.indexOf(gen) === -1) {
            gotagenre = false;
          }
        });
        // ...if the move has a selected genre, show it if it's rating is sufficient
        if (gotagenre && thismovier >= selectedRating) {
          resultcount++;
          movie.classList.remove('transition');
          movie.classList.remove('hide');
        } else {
          movie.classList.add('transition');
          setTimeout(() => {
            movie.classList.add('hide');
          }, 260);
        }
      }
    });

    // if we have no matches, tell the user
    let noresmsg = document.querySelector('.nores');
    if (resultcount === 0 && (noresmsg === null)) {
      let noresultdiv = document.createElement('p');
      noresultdiv.appendChild(document.createTextNode('No movies match your selected criteria.'));
      noresultdiv.classList.add('nores');
      movieholder.appendChild(noresultdiv);
    // or hide the 'no matches' message, if it's present
    } else if (resultcount > 0 && (noresmsg !== null)) {
      noresmsg.remove();
    }
  };

  // wait for the DOM to load
  document.addEventListener('DOMContentLoaded', () => {
    // get the list of movies
    let movieList = loadJson('data/TMDb Movies Now Playing API.json', 'movie');
    movieList.then((movieData) => {
      // then get the genres
      let genreList = loadJson('data/TMDb Movie genres API.json', 'genre');
      genreList.then((genreData) => {
        // add the relevant genre labels to each movie
        let movielist = combineGenreData(movieData, genreData);
        // display the movies on the page
        displayMovies(movielist);
        // add the genre inputs to the page
        displayGenreCheckbs();
        // handle user input
        setupEventHandlers();
      })
      .catch((typ) => {
        handleLoadingError(typ);
      });
    })
    .catch((typ) => {
      handleLoadingError(typ);
    });
  });
})();
