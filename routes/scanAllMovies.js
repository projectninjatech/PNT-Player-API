require('dotenv').config();
const express = require('express');
const router = express.Router();
const Movie = require('../models/movie');
const User = require('../models/User')
const path = require('path');
const fs = require('fs');

const directory = process.env.MOVIE_DIR;
const absolutePath = path.resolve(directory);

let clients = [];

router.post('/scanAllLocalMovies', async (req, res) => {

    await User.updateMany({}, { $set: { watchedMovies: [], mylist: [] } });
    // await Movie.deleteMany({});
    await Movie.deleteMany({ ignoreTitleOnScan: { $ne: true } });

    // Find all movies with ignoreTitleOnScan set to true and project only the downloadLink field
    const movies = await Movie.find({ ignoreTitleOnScan: true }, 'downloadLink');

    // Extract and process the downloadLink to get the filenames
    const ignoredFilesOnScan = movies.map(movie => {
        const url = new URL(movie.downloadLink);
        const path = url.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1).replace("%20","");
        return decodeURIComponent(filename);
    });

    console.log("Files to be ignored on scan",ignoredFilesOnScan)
    
    let processedMovies = 0;

    res.status(200).send({ message: 'Processing started' });

    const files = fs.readdirSync(absolutePath);
    
    // Removing ignored files from the list of all files
    const filesToScan = files.filter(file => !ignoredFilesOnScan.includes(file));
    console.log("Files to scan:", filesToScan);
    console.log("All files",files)

    const regexPattern = /^(.+?)(?:\s|\.)?(\d{4})/;
    const totalMovies = filesToScan.length;

    for (let index = 0; index < filesToScan.length; index++) {
        const file = filesToScan[index];
        const match = file.match(regexPattern);
        const movieName = match ? match[1] : file;
        const modifiedName = movieName.replace(/\(|\)/g, '').replace(/\./g, ' ');

        console.log(`Index: ${processedMovies + 1}, Total: ${totalMovies}, Title: ${modifiedName}`);
        
        clients.forEach(client => {
            console.log(`Sending update to client: ${processedMovies + 1} / ${totalMovies} - ${modifiedName}`);
            client.res.write(`data: ${JSON.stringify({ index: processedMovies + 1, total: totalMovies, title: modifiedName })}\n\n`);
        });

        const search_term = encodeURIComponent(modifiedName);

        const url = `https://api.themoviedb.org/3/search/movie?query=${search_term}&include_adult=false&language=en-US&page=1`;
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: process.env.TMDB_AUTH_KEY // Replace with your TMDB API key
            }
        };

        try {
            const responseData = await fetch(url, options);
            const result = await responseData.json();
            // console.log("Movies response",result)

            // Return only the first result if available
            const movieId = result.results.length > 0 ? result.results[0].id : null;

            if (movieId) {
                // Fetch additional details for the movie
                const movieDetailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`;
                const movieDetailsResponse = await fetch(movieDetailsUrl, options);
                const movieDetailsResult = await movieDetailsResponse.json();

                // Fetch watch providers
                const watchProvidersUrl = `https://api.themoviedb.org/3/movie/${movieId}/watch/providers`;
                const watchProvidersResponse = await fetch(watchProvidersUrl, options);
                const watchProvidersResult = await watchProvidersResponse.json();

                const watchProviders = Object.keys(watchProvidersResult.results)
                    .filter((country) => country === "IN") // Filter only the country with code "IN"
                    .map((country) => {
                        const countryData = watchProvidersResult.results[country];
                        return {
                            country,
                            providerName: countryData.flatrate ? countryData.flatrate[0]?.provider_name : "No Provider",
                        };
                    });

                // Modify movie details object with additional data
                const genreIds = movieDetailsResult.genres.map(genre => genre.id);
                const genreNames = movieDetailsResult.genres.map(genre => genre.name);
                const productionCompanies = movieDetailsResult.production_companies.map(company => company.name);

                const downloadLink = `${process.env.HTTP_SERVER_ADDR}/movies/${encodeURIComponent(file)}`; // Adjust the URL accordingly

                const newMovie = new Movie({
                    movieID: movieDetailsResult.id,
                    backdropPath: 'https://image.tmdb.org/t/p/original' + movieDetailsResult.backdrop_path,
                    budget: Number(movieDetailsResult.budget),
                    genreIds: genreIds.map(id => Number(id)),
                    genres: genreNames,
                    originalTitle: movieDetailsResult.original_title,
                    overview: movieDetailsResult.overview,
                    popularity: Number(movieDetailsResult.popularity),
                    posterPath: 'https://image.tmdb.org/t/p/original' + movieDetailsResult.poster_path,
                    productionCompanies: productionCompanies,
                    releaseDate: movieDetailsResult.release_date,
                    revenue: Number(movieDetailsResult.revenue),
                    runtime: Number(movieDetailsResult.runtime),
                    status: movieDetailsResult.status,
                    title: movieDetailsResult.title,
                    watchProviders: watchProviders.map(provider => provider.providerName),
                    logos: 'https://image.tmdb.org/t/p/original',
                    downloadLink: downloadLink, // Use the provided download link
                    ignoreTitleOnScan: false
                });

                // Save the movie instance to the database
                await newMovie.save();
            }
        } catch (error) {
            console.error('Error processing movie:', error);
        }

        processedMovies++;
    }

     // Send completion update to all connected clients
     console.log('Sending completion update to all clients');
     clients.forEach(client => client.res.write('data: {"complete": true}\n\n'));
     clients.forEach(client => client.res.end());
     clients.length = 0;
});

router.get('/progress', (req, res) => {
    console.log('Client connected for progress updates');
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with client

    clients.push({ res });
    console.log('Number of connected clients:', clients.length);

    req.on('close', () => {
        clients = clients.filter(client => client.res !== res);
        console.log('Client disconnected, remaining clients:', clients.length);
    });
});



module.exports = router;