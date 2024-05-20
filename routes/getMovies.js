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