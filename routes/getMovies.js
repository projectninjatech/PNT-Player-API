// routes/movies.js
const express = require('express');
const router = express.Router();
const Movie = require('../models/movie'); // Assuming the path is correct

// Endpoint to get all movies
router.get('/getMovies/:genreID?', async (req, res) => {
  try {
    const { genreID } = req.params;

    // Check if a genre is provided
    if (genreID) {
      if (genreID === "Netflix") {
        const moviesByWatchProvider = await Movie.find({
          watchProviders: { $in: [genreID] }
        });
        res.json(moviesByWatchProvider);
      } else {
        const moviesByGenre = await Movie.find({ genreIds: genreID });
        res.json(moviesByGenre);
      }
    } else {
      // If no genre is provided, return all movies
      const allMovies = await Movie.find();
      res.json(allMovies);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/getSimilarMovies/:movieID', async (req, res) => {
  try {
    const { movieID } = req.params;

    // Find the selected movie by its ID
    const selectedMovie = await Movie.findById(movieID);

    // Ensure the movie is found
    if (!selectedMovie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Find similar movies based on genres
    const similarMovies = await Movie.find({
      genreIds: { $in: selectedMovie.genreIds },
      _id: { $ne: movieID } // Exclude the selected movie itself
    });

    res.json(similarMovies);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

const getUniqueGenres = (movies) => {
  const genresSet = new Set();

  // Iterate through each show and add its genres to the set
  movies.forEach((movie) => {
    movie.genres.forEach((genre) => {
      genresSet.add(genre);
    });
  });

  // Convert the set to an array to get unique genres
  const uniqueGenres = [...genresSet];

  return uniqueGenres;
};


router.get('/getAllMoviesGenres', async (req, res) => {
  try {
    // Retrieve all shows from the database
    const allMovies = await Movie.find();

    // Extract unique genres from the shows data
    const uniqueGenres = getUniqueGenres(allMovies);

    // Send the unique genres as a response
    res.json(uniqueGenres);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/getAllMoviesByGenre', async (req, res) => {
  try {
    // Step 1: Fetch all distinct genres
    const distinctGenres = await Movie.distinct('genres');

    // Step 2: For each genre, fetch shows
    const moviesByGenre = await Promise.all(
      distinctGenres.map(async (genre) => {
        const movie = await Movie.find({ genres: genre });
        return { genre, movie };
      })
    );

    res.json(moviesByGenre);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/searchMovies/:movieName', async (req, res) => {
  try {
    const { movieName } = req.params;

    // Use a case-insensitive regular expression to perform a partial match on movie names
    const matchingMovies = await Movie.find({ title: { $regex: new RegExp(movieName, 'i') } });

    res.json(matchingMovies);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;