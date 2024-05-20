require('dotenv').config();
const express = require('express');
const router = express.Router();
const Shows = require('../models/Shows')
const User = require('../models/User')
const path = require('path');
const fs = require('fs');


const directory = process.env.SHOWS_DIR;
const absolutePath = path.resolve(directory);


async function scanDirectory(dir, filenames = [], titles = [], filepaths = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            await scanDirectory(filePath, filenames, titles, filepaths);
        } else {
            const showTitleMatch = file.match(/^(.+?)\.S\d{2}/);
            let showTitle = showTitleMatch ? showTitleMatch[1] : file;
            showTitle = showTitle.replace(/\./g, ' ');
            if (!titles.includes(showTitle)) {
                titles.push(showTitle);
            }
            const filefullpath = path.join(dir, file);
            const filepathWithoutPrefix = filefullpath
                .replace(/.*?TV Shows\\/, '')
                .replace(/\\/g, '/');
            filenames.push(file);
            filepaths.push(filepathWithoutPrefix);
        }
    }

    return { titles, filenames, filepaths };
}

async function fetchDetailedShowDetails(showID, options) {
    const url = `https://api.themoviedb.org/3/tv/${showID}?language=en-US`;
    const showsData = await fetch(url, options);
    const showsDetails = await showsData.json();

    if (!showsDetails) {
        return null;
    }

    const genreIds = showsDetails.genres.map(genre => genre.id);
    const genreNames = showsDetails.genres.map(genre => genre.name);
    // showsDetails.production_companies = showsDetails.production_companies.map(company => company.name);

    showsDetails.genreIds = genreIds;
    showsDetails.genres = genreNames;

    const numOfSeasons = showsDetails.number_of_seasons;

    showsDetails.seasons = [];

    for (let i = 1; i <= numOfSeasons; i++) {
        const seasonUrl = `https://api.themoviedb.org/3/tv/${showID}/season/${i}?language=en-US`;
        const response = await fetch(seasonUrl, options);
        const seasonData = await response.json();

        const episodes = seasonData.episodes.map(episode => ({
            episode_number: episode.episode_number,
            name: episode.name,
            runtime: episode.runtime,
            overview: episode.overview,
            poster: "https://image.tmdb.org/t/p/original" + episode.still_path,
            downloadLink: ""
        }));

        showsDetails.seasons.push({
            season_number: seasonData.season_number,
            episodes: episodes
        });
    }

    return {
        first_air_date: showsDetails.first_air_date,
        genres: showsDetails.genres,
        id: showsDetails.id,
        name: showsDetails.name,
        overview: showsDetails.overview,
        poster_path: "https://image.tmdb.org/t/p/original" + showsDetails.poster_path,
        vote_average: showsDetails.vote_average,
        seasons: showsDetails.seasons
    };
}

async function addDownloadLink(shows, filePaths) {
    // console.log("Show name", shows)
    shows.forEach(show => {
        const { showDetails } = show;

        console.log("Show Name", showDetails.name.replace(/:/g, '').replace(/,/g, '').replace(/\s/g, '.').toLowerCase())

        const { seasons } = showDetails;
        seasons.forEach(season => {
            const { season_number, episodes } = season;

            // console.log("Show season num",season_number)

            episodes.forEach(episode => {
                // console.log("Show episodename",episode.episode_number)
                // console.log("Name", episode.name)
                // console.log("Download Link", episode.downloadLink)
                const formattedSeason = String(season_number).padStart(2, '0');
                const formattedEpisode = String(episode.episode_number).padStart(2, '0');

                // console.log(`${showDetails.name}.S${formattedSeason}E${formattedEpisode}`)

                const matchingFilePath = filePaths.find(filePath =>
                    filePath.toLowerCase().includes(showDetails.name.replace(/:/g, '').replace(/,/g, '').replace(/\s/g, '.').toLowerCase()) &&
                    filePath.includes(`S${formattedSeason}E${formattedEpisode}`)
                );

                console.log("Matching file path", matchingFilePath)
                // const filePath = matchingFilePath ? `http://192.168.0.148:8080/${matchingFilePath.replace(/\s/g, '%20')}` : "Filepath not found";

                // episode.downloadLink = filePath

                const filePathWithoutPrefix = matchingFilePath ? `${process.env.HTTP_SERVER_ADDR}/shows/${matchingFilePath.replace(/^.*?shows[\\/]/i, '').replace(/\s/g, '%20')}` : "Filepath not found";

                episode.downloadLink = filePathWithoutPrefix;

                // console.log(`Show: ${showDetails.name}, Season: S${formattedSeason}E${formattedEpisode}, Filepath: ${filePath}`)
            });
        });

    });

    return shows
}



router.get('/scanAllShows', async (req, res) => {

    try {
        await User.updateMany({}, { $set: { watchedShows: [], showsMylist: [] } });
        await Shows.deleteMany({});
        const { titles, filenames, filepaths } = await scanDirectory(absolutePath);
        console.log("Filepaths", filepaths);

        const shows = [];

        for (const title of titles) {

            const url = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(title)}&include_adult=false&language=en-US&page=1`;
            const options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    Authorization: process.env.TMDB_AUTH_KEY
                }
            };

            try {
                const responseData = await fetch(url, options);
                const result = await responseData.json();

                if (result && result.results && result.results.length > 0) {
                    const showID = result.results[0].id;
                    const showDetails = await fetchDetailedShowDetails(showID, options);

                    if (showDetails) {
                        shows.push({
                            showDetails,
                        });
                    }
                }
            } catch (error) {
                console.error(`Error fetching details for ${title}:`, error);
            }
        }

        // console.log("All TV Shows are", shows);

        var modifiedShowDetails = await addDownloadLink(shows, filepaths);

        for (const modifiedShow of modifiedShowDetails) {
            try {
                const existingShow = await Shows.findOne({ name: modifiedShow.showDetails.name });
                if (existingShow) {
                    console.log(`Show '${modifiedShow.showDetails.name}' already exists. Skipping...`);
                } else {

                    // Use your existing code for adding shows manually
                    const newShowsDocument = new Shows({
                        genres: modifiedShow.showDetails.genres,
                        overview: modifiedShow.showDetails.overview,
                        posterPath: modifiedShow.showDetails.poster_path,
                        releaseDate: new Date(modifiedShow.showDetails.first_air_date),
                        name: modifiedShow.showDetails.name,
                        ratings: modifiedShow.showDetails.vote_average,
                        seasons: modifiedShow.showDetails.seasons.map(season => ({
                            season_number: season.season_number,
                            episodes: season.episodes.map(episode => ({
                                episode_number: episode.episode_number,
                                name: episode.name,
                                runtime: episode.runtime,
                                overview: episode.overview,
                                poster: episode.poster,
                                downloadLink: episode.downloadLink
                            }))
                        }))
                    });

                    // Save the document to the database
                    const savedShows = await newShowsDocument.save();
                    console.log('Show saved to MongoDB:', savedShows);
                }
            } catch (error) {
                console.error('Error saving show to MongoDB:', error);
            }
        }

        res.json(modifiedShowDetails);
    } catch (error) {
        console.error('Error scanning shows:', error);
        res.status(500).send('Internal Server Error');
    }

});


module.exports = router;