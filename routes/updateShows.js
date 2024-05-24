const express = require('express');
const router = express.Router();
const Shows = require('../models/Shows');

router.get('/edit-shows-list', async (req, res) => {
    try {
        const shows = await Shows.find();
        console.log("TV Shows list are",shows)
        res.render('editShowList', { shows });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/shows/:id', async (req, res) => {
    try {
        const show = await Shows.findById(req.params.id);
        console.log("TV Show details update",show)
        res.render('updateShowsDetail', { showsDetails: show });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/update-show/:id', async (req, res) => {
    try {
        const existingShow = await Shows.findById(req.params.id);

        if (!existingShow) {
            return res.status(404).send('Show not found');
        }

        console.log("Request body", req.body)

        await Shows.findByIdAndUpdate(
            req.params.id,
            {
                genres: req.body.showDetails.genres.split(',').map(genre => genre.trim()),
                name: req.body.showDetails.name,
                overview: req.body.showDetails.overview,
                ratings: Number(req.body.showDetails.vote_average),
                posterPath: req.body.showDetails.poster_path,
                backdropPath: req.body.showDetails.backdrop_path,
                releaseDate: req.body.showDetails.first_air_date,
                seasons: req.body.seasons.map(season => ({
                    season_number: Number(season.season_number),
                    episodes: season.episodes.map(episode => ({
                        episode_number: Number(episode.episode_number),
                        name: episode.name,
                        runtime: Number(episode.runtime),
                        overview: episode.overview,
                        poster: episode.poster,
                        downloadLink: episode.downloadLink
                    }))
                }))
            },
            { new: true }
        );

        res.json({ success: true })
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;