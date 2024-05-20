// routes/deleteMovie.js
const express = require('express');
const router = express.Router();
const Movie = require('../models/movie');
const User = require('../models/User')

router.get('/delete-movie', async (req, res) => {
    try {
        const movies = await Movie.find();
        res.render('deleteMovie', { movies });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/delete-movie/:id', async (req, res) => {
    try {
        const deletedMovie = await Movie.findOneAndDelete({ _id: req.params.id });

        // Remove the movie from users' mylist
        await User.updateMany({}, { $pull: { mylist: req.params.id } });

        // Remove the movie from users' watchedMovies
        await User.updateMany({}, { $pull: { "watchedMovies": { movie: req.params.id } } });

        const movies = await Movie.find();
        res.render('deleteMovie', { movies, successMessage: 'Movie deleted successfully!' });
        // res.redirect('/delete-movie');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
