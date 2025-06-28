require('dotenv').config();
const express = require('express');
const router = express.Router()
const Movie = require('../models/movie')

router.post('/fetch-movie', async (req, res) => {
    let search_term = req.body.searchTerm;

    try {
        const url = `https://api.themoviedb.org/3/search/movie?query=${search_term}&include_adult=false&language=en-US&page=1`;
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: process.env.TMDB_AUTH_KEY
            }
        };

        const responseData = await fetch(url, options);
        const result = await responseData.json();
        console.log("Result", result);

        // Check if any results were found
        if (result.results.length === 0) {
            return res.status(404).json({ error: 'No movies found with the given search term' });
        }

        // Render the page with a list of movies and posters
        res.render('addMovieList', { movieList: result.results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch movie details' });
    }
});

// Create a new route for handling movie selection
router.get('/addMovie/:movieId', async (req, res) => {
    const movieId = req.params.movieId;

    try {
        const url = `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`;
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: process.env.TMDB_AUTH_KEY
            }
        };

        const movieData = await fetch(url, options);
        const movieDetails = await movieData.json();

        const watchProvidersUrl = `https://api.themoviedb.org/3/movie/${movieId}/watch/providers`;
        const watchProvidersResponse = await fetch(watchProvidersUrl, options);
        const watchProvidersResult = await watchProvidersResponse.json();

        const watchProviders = Object.keys(watchProvidersResult.results)
            .filter((country) => country === "IN") // Filter only the country with code "IN"
            .map((country) => {
                const countryData = watchProvidersResult.results[country];
                return {
                    country,
                    providerName: countryData.flatrate ? countryData.flatrate[0]?.provider_name : countryData.buy[0]?.provider_name,
                };
            });

        movieDetails.watchProviders = watchProviders;

        const genreIds = movieDetails.genres.map(genre => genre.id);
        const genreNames = movieDetails.genres.map(genre => genre.name);
        movieDetails.production_companies = movieDetails.production_companies.map(company => company.name);
        movieDetails.watchProviders = watchProviders.map(provider => provider.providerName);

        movieDetails.genreIds = genreIds;
        movieDetails.genres = genreNames;

        console.log("Movie Details", movieDetails)

        const successMessage = req.query.success ? 'Movie details submitted successfully!' : null;

        // Render the addMovie page with the details of the selected movie
        res.render('addMovie', { movieDetails, successMessage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch movie details' });
    }
});



router.post('/add-movie-details', async (req, res) => {
    try {
        const movieDetails = req.body;

        console.log("Movie Details", movieDetails)

        const genreIds = movieDetails.genreIds.split(',').map(id => Number(id));

        // console.log("Genre ID", genreIds)
        // Save movieDetails to MongoDB (use your Movie model)

        const existingMovie = await Movie.findOne({ movieID: movieDetails.id });

        if (existingMovie) {
            // Movie with the same movieID already exists, return a JSON response
            console.log(`Movie with movieID ${movieDetails.id} already exists. Skipping.`);
            return res.status(400).json({ error: `Movie with movieID ${movieDetails.id} already exists. Skipping.` });
        }

        const newMovie = new Movie({
            movieID: movieDetails.id,
            backdropPath: 'https://image.tmdb.org/t/p/original' + movieDetails.backdrop_path,
            budget: Number(movieDetails.budget),
            genreIds: genreIds,
            genres: movieDetails.genres.split(','),
            originalTitle: movieDetails.original_title,
            overview: movieDetails.overview,
            ratings: Number(movieDetails.ratings),
            popularity: Number(movieDetails.popularity),
            posterPath: 'https://image.tmdb.org/t/p/original' + movieDetails.poster_path,
            productionCompanies: movieDetails.production_companies,
            releaseDate: movieDetails.release_date,
            revenue: Number(movieDetails.revenue),
            runtime: Number(movieDetails.runtime),
            status: movieDetails.status,
            title: movieDetails.title,
            watchProviders: movieDetails.watchProviders,
            logos: 'https://image.tmdb.org/t/p/original' + movieDetails.logos,
            downloadLink: movieDetails.downloadLink,
            ignoreTitleOnScan: movieDetails.ignoreTitleOnScan
        });

        const savedMovie = await newMovie.save();

        res.redirect(`/addMovie/${savedMovie.movieID}?success=true`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit movie details' });
    }
});

module.exports = router;