// require('dotenv').config();
// const express = require('express');
// const router = express.Router();
// const Movie = require('../models/movie');
// const User = require('../models/User')
// const path = require('path');
// const fs = require('fs');


// const directory = process.env.MOVIE_DIR;
// const absolutePath = path.resolve(directory);


// router.get('/scanAllMovies', async (req, res) => {

//     await User.updateMany({}, { $set: { watchedMovies: [], mylist: [] } });
//     await Movie.deleteMany({});

//     // Read the list of files in the directory
//     const files = fs.readdirSync(absolutePath);
//     const regexPattern = /^(.+?)(?:\s|\.)?(\d{4})/;


//     // Extract only the movie names without the path and year, and perform additional modifications
//     const movieDetailsPromises = files.map(async (file, index) => {
//         console.log(`${index}. ${file}`)
//         const match = file.match(regexPattern);
//         const movieName = match ? match[1] : file; // Use the first capturing group (movie name)

//         // Remove parentheses and replace dots with spaces
//         const modifiedName = movieName.replace(/\(|\)/g, '').replace(/\./g, ' ');

//         console.log(`Modified name: ${modifiedName}`);

//         const search_term = encodeURIComponent(modifiedName);
//         const url = `https://api.themoviedb.org/3/search/movie?query=${search_term}&include_adult=false&language=en-US&page=1`;
//         const options = {
//             method: 'GET',
//             headers: {
//                 accept: 'application/json',
//                 Authorization: process.env.TMDB_AUTH_KEY // Replace with your TMDB API key
//             }
//         };

//         const responseData = await fetch(url, options);
//         const result = await responseData.json();

//         // Return only the first result if available
//         const movieId = result.results.length > 0 ? result.results[0].id : null;

//         if (movieId) {
//             // Fetch additional details for the movie
//             const movieDetailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`;
//             const movieDetailsResponse = await fetch(movieDetailsUrl, options);
//             const movieDetailsResult = await movieDetailsResponse.json();

//             // Fetch watch providers
//             const watchProvidersUrl = `https://api.themoviedb.org/3/movie/${movieId}/watch/providers`;
//             const watchProvidersResponse = await fetch(watchProvidersUrl, options);
//             const watchProvidersResult = await watchProvidersResponse.json();

//             const watchProviders = Object.keys(watchProvidersResult.results)
//                 .filter((country) => country === "IN") // Filter only the country with code "IN"
//                 .map((country) => {
//                     const countryData = watchProvidersResult.results[country];
//                     return {
//                         country,
//                         // providerName: countryData.flatrate ? countryData.flatrate[0]?.provider_name : countryData.buy[0]?.provider_name,
//                         providerName: countryData.flatrate ? countryData.flatrate[0]?.provider_name : "No Provider",
//                     };
//                 });

//             // Modify movie details object with additional data
//             const genreIds = movieDetailsResult.genres.map(genre => genre.id);
//             const genreNames = movieDetailsResult.genres.map(genre => genre.name);
//             const productionCompanies = movieDetailsResult.production_companies.map(company => company.name);

//             const downloadLink = `${process.env.HTTP_SERVER_ADDR}/movies/${encodeURIComponent(file)}`; // Adjust the URL accordingly

//             return {
//                 ...movieDetailsResult,
//                 genreIds,
//                 genres: genreNames,
//                 production_companies: productionCompanies,
//                 watchProviders: watchProviders.map(provider => provider.providerName),
//                 downloadLink: downloadLink, // Include the download link
//             };
//         }

//         return null;
//     });

//     // Wait for all promises to resolve
//     const movieDetails = await Promise.all(movieDetailsPromises);

//     console.log("Movie Details list",movieDetails)
//     // Loop through movieDetails and create Movie instances
//     const movieInstances = movieDetails.map(async (movieDetail, index) => {

//         // if (!movieDetail) {
//         //     console.log(`Movie details for index ${index} is null. Skipping.`);
//         //     return null;
//         // }

//         if (!movieDetail) {
//             console.log(`Movie details for index ${index} is null. Creating empty movie entry.`);
//             const newMovie = new Movie({
//                 // Set all fields to blank or default values
//                 title: files[index],
//                 originalTitle: files[index],
//                 overview: '',
//                 releaseDate: '',
//                 genreIds: [],
//                 genres: [],
//                 productionCompanies: [],
//                 backdropPath: '',
//                 budget: 0,
//                 popularity: 0,
//                 posterPath: '',
//                 revenue: 0,
//                 runtime: 0,
//                 status: '',
//                 watchProviders: [],
//                 logos: '',
//                 downloadLink: `${process.env.HTTP_SERVER_ADDR}/movies/${encodeURIComponent(files[index])}`, // Use the provided download link
//             });
    
//             // Save the movie instance to the database
//             await newMovie.save();
    
//             return newMovie;
//         }
        
//         // Check if the movie with the same movieID already exists
//         const existingMovie = await Movie.findOne({ movieID: movieDetail.id });

//         if (existingMovie) {
//             // Movie with the same movieID already exists, skip saving
//             console.log(`Movie with movieID ${movieDetail.id} already exists. Skipping.`);
//             return null;
//         }

//         const newMovie = new Movie({
//             movieID: movieDetail.id,
//             backdropPath: 'https://image.tmdb.org/t/p/original' + movieDetail.backdrop_path,
//             budget: Number(movieDetail.budget),
//             genreIds: movieDetail.genreIds.map(id => Number(id)),
//             genres: movieDetail.genres,
//             originalTitle: movieDetail.original_title,
//             overview: movieDetail.overview,
//             popularity: Number(movieDetail.popularity),
//             posterPath: 'https://image.tmdb.org/t/p/original' + movieDetail.poster_path,
//             productionCompanies: movieDetail.production_companies,
//             releaseDate: movieDetail.release_date,
//             revenue: Number(movieDetail.revenue),
//             runtime: Number(movieDetail.runtime),
//             status: movieDetail.status,
//             title: movieDetail.title,
//             watchProviders: movieDetail.watchProviders,
//             logos: 'https://image.tmdb.org/t/p/original',
//             downloadLink: movieDetail.downloadLink, // Use the provided download link
//         });

//         // Save the movie instance to the database
//         await newMovie.save();

//         return newMovie;
//     });

//     // Wait for all movie instances to be saved
//     const savedMovies = await Promise.all(movieInstances);

//     // Filter out null values (skipped movies) from the savedMovies array
//     const filteredSavedMovies = savedMovies.filter(movie => movie !== null);

//     // Send the movie details as JSON
//     res.json({ movies: filteredSavedMovies });
// });


// module.exports = router;
















require('dotenv').config();
const express = require('express');
const router = express.Router();
const Movie = require('../models/movie');
const User = require('../models/User')
const path = require('path');
const fs = require('fs');

const directory = process.env.MOVIE_DIR;
const absolutePath = path.resolve(directory);

// router.get('/scanAllMovies', async (req, res) => {

//     await User.updateMany({}, { $set: { watchedMovies: [], mylist: [] } });
//     await Movie.deleteMany({});

//     // Read the list of files in the directory
//     const files = fs.readdirSync(absolutePath);
//     const regexPattern = /^(.+?)(?:\s|\.)?(\d{4})/;


//     // Extract only the movie names without the path and year, and perform additional modifications
//     const movieDetailsPromises = files.map(async (file, index) => {
//         console.log(`${index}. ${file}`)
//         const match = file.match(regexPattern);
//         const movieName = match ? match[1] : file; // Use the first capturing group (movie name)

//         // Remove parentheses and replace dots with spaces
//         const modifiedName = movieName.replace(/\(|\)/g, '').replace(/\./g, ' ');

//         console.log(`Modified name: ${modifiedName}`);

//         const search_term = encodeURIComponent(modifiedName);
//         const url = `https://api.themoviedb.org/3/search/movie?query=${search_term}&include_adult=false&language=en-US&page=1`;
//         const options = {
//             method: 'GET',
//             headers: {
//                 accept: 'application/json',
//                 Authorization: process.env.TMDB_AUTH_KEY // Replace with your TMDB API key
//             }
//         };

//         const responseData = await fetch(url, options);
//         const result = await responseData.json();

//         // Return only the first result if available
//         const movieId = result.results.length > 0 ? result.results[0].id : null;

//         if (movieId) {
//             // Fetch additional details for the movie
//             const movieDetailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`;
//             const movieDetailsResponse = await fetch(movieDetailsUrl, options);
//             const movieDetailsResult = await movieDetailsResponse.json();

//             // Fetch watch providers
//             const watchProvidersUrl = `https://api.themoviedb.org/3/movie/${movieId}/watch/providers`;
//             const watchProvidersResponse = await fetch(watchProvidersUrl, options);
//             const watchProvidersResult = await watchProvidersResponse.json();

//             const watchProviders = Object.keys(watchProvidersResult.results)
//                 .filter((country) => country === "IN") // Filter only the country with code "IN"
//                 .map((country) => {
//                     const countryData = watchProvidersResult.results[country];
//                     return {
//                         country,
//                         // providerName: countryData.flatrate ? countryData.flatrate[0]?.provider_name : countryData.buy[0]?.provider_name,
//                         providerName: countryData.flatrate ? countryData.flatrate[0]?.provider_name : "No Provider",
//                     };
//                 });

//             // Modify movie details object with additional data
//             const genreIds = movieDetailsResult.genres.map(genre => genre.id);
//             const genreNames = movieDetailsResult.genres.map(genre => genre.name);
//             const productionCompanies = movieDetailsResult.production_companies.map(company => company.name);

//             const downloadLink = `${process.env.HTTP_SERVER_ADDR}/movies/${encodeURIComponent(file)}`; // Adjust the URL accordingly

//             return {
//                 ...movieDetailsResult,
//                 genreIds,
//                 genres: genreNames,
//                 production_companies: productionCompanies,
//                 watchProviders: watchProviders.map(provider => provider.providerName),
//                 downloadLink: downloadLink, // Include the download link
//             };
//         }

//         return null;
//     });

//     // Wait for all promises to resolve
//     const movieDetails = await Promise.all(movieDetailsPromises);

//     console.log("Movie Details list",movieDetails)
//     // Loop through movieDetails and create Movie instances
//     const movieInstances = movieDetails.map(async (movieDetail, index) => {

//         // if (!movieDetail) {
//         //     console.log(`Movie details for index ${index} is null. Skipping.`);
//         //     return null;
//         // }

//         if (!movieDetail) {
//             console.log(`Movie details for index ${index} is null. Creating empty movie entry.`);
//             const newMovie = new Movie({
//                 // Set all fields to blank or default values
//                 title: files[index],
//                 originalTitle: files[index],
//                 overview: '',
//                 releaseDate: '',
//                 genreIds: [],
//                 genres: [],
//                 productionCompanies: [],
//                 backdropPath: '',
//                 budget: 0,
//                 popularity: 0,
//                 posterPath: '',
//                 revenue: 0,
//                 runtime: 0,
//                 status: '',
//                 watchProviders: [],
//                 logos: '',
//                 downloadLink: `${process.env.HTTP_SERVER_ADDR}/movies/${encodeURIComponent(files[index])}`, // Use the provided download link
//             });

//             // Save the movie instance to the database
//             await newMovie.save();

//             return newMovie;
//         }

//         // Check if the movie with the same movieID already exists
//         const existingMovie = await Movie.findOne({ movieID: movieDetail.id });

//         if (existingMovie) {
//             // Movie with the same movieID already exists, skip saving
//             console.log(`Movie with movieID ${movieDetail.id} already exists. Skipping.`);
//             return null;
//         }

//         const newMovie = new Movie({
//             movieID: movieDetail.id,
//             backdropPath: 'https://image.tmdb.org/t/p/original' + movieDetail.backdrop_path,
//             budget: Number(movieDetail.budget),
//             genreIds: movieDetail.genreIds.map(id => Number(id)),
//             genres: movieDetail.genres,
//             originalTitle: movieDetail.original_title,
//             overview: movieDetail.overview,
//             popularity: Number(movieDetail.popularity),
//             posterPath: 'https://image.tmdb.org/t/p/original' + movieDetail.poster_path,
//             productionCompanies: movieDetail.production_companies,
//             releaseDate: movieDetail.release_date,
//             revenue: Number(movieDetail.revenue),
//             runtime: Number(movieDetail.runtime),
//             status: movieDetail.status,
//             title: movieDetail.title,
//             watchProviders: movieDetail.watchProviders,
//             logos: 'https://image.tmdb.org/t/p/original',
//             downloadLink: movieDetail.downloadLink, // Use the provided download link
//         });

//         // Save the movie instance to the database
//         await newMovie.save();

//         return newMovie;
//     });

//     // Wait for all movie instances to be saved
//     const savedMovies = await Promise.all(movieInstances);

//     // Filter out null values (skipped movies) from the savedMovies array
//     const filteredSavedMovies = savedMovies.filter(movie => movie !== null);

//     // Send the movie details as JSON
//     res.json({ movies: filteredSavedMovies });
// });









let clients = [];

router.post('/scanAllLocalMovies', async (req, res) => {

    await User.updateMany({}, { $set: { watchedMovies: [], mylist: [] } });
    await Movie.deleteMany({});
    let processedMovies = 0;

    res.status(200).send({ message: 'Processing started' });

    const files = fs.readdirSync(absolutePath);
    const regexPattern = /^(.+?)(?:\s|\.)?(\d{4})/;
    const totalMovies = files.length;

    for (let index = 0; index < files.length; index++) {
        const file = files[index];
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