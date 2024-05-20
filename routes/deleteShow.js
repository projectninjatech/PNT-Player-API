// routes/deleteMovie.js
const express = require('express');
const router = express.Router();
const Shows = require('../models/Shows');

router.get('/delete-show', async (req, res) => {
    try {
        const shows = await Shows.find();
        console.log("Delete Shows",shows)
        res.render('deleteShow', { shows });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/delete-show/:id', async (req, res) => {
    try {
        const deleteShow = await Shows.findOneAndDelete({ _id: req.params.id });

        // // Remove the movie from users' mylist
        // await User.updateMany({}, { $pull: { mylist: req.params.id } });

        // // Remove the movie from users' watchedMovies
        // await User.updateMany({}, { $pull: { "watchedMovies": { movie: req.params.id } } });

        const shows = await Shows.find();
        res.render('deleteShow', { shows, successMessage: 'Movie deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
