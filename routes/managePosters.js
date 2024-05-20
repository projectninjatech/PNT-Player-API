require('dotenv').config();
const express = require('express');
const router = express.Router();
const Shows = require('../models/Shows');
const Movies = require('../models/movie')
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadPoster(posterURL, posterID) {
    try {
        // console.log("Poster ID", posterID)
        const response = await axios.get(posterURL, {
            responseType: 'stream'
        });

        const posterDirectory = `${process.env.HTTP_SERVER_MEDIA_DIR}/posters`;
        const posterPath = path.join(posterDirectory, `${posterID}.jpg`);
        response.data.pipe(fs.createWriteStream(posterPath));

        return new Promise((resolve, reject) => {
            response.data.on('end', () => {
                resolve();
            });

            response.data.on('error', (err) => {
                reject(err);
            });
        });
    } catch (error) {
        console.error('Error downloading poster:', error);
        return null;
    }
}

router.get('/download-movies-posters', async (req, res) => {
    try {
        // Fetch all movies with their poster URLs
        const movies = await Movies.find({}, 'posterPath');

        for (const movie of movies) {
            const posterURL = movie.posterPath;
            const posterID = posterURL.substring(posterURL.lastIndexOf('/') + 1, posterURL.lastIndexOf('.'));
            await downloadPoster(posterURL, posterID);
        }

        // Update poster URLs in the database
        const oldUrlPrefix = 'https://image.tmdb.org/t/p/original/';
        const newUrlPrefix = `${process.env.HTTP_SERVER_ADDR}/posters/`;

        for (const movie of movies) {
            const newPosterUrl = movie.posterPath.replace(oldUrlPrefix, newUrlPrefix);
            await Movies.updateOne({ _id: movie._id }, { posterPath: newPosterUrl });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error downloading movie posters:', error);
        res.status(500).json({ success: false, error: 'Failed to download movie posters' });
    }
});


router.get('/download-shows-posters', async (req, res) => {
    try {
        // Fetch all shows with their episodes
        const shows = await Shows.find({}, 'posterPath seasons');

        const oldUrlPrefix = 'https://image.tmdb.org/t/p/original/';
        const newUrlPrefix = `${process.env.HTTP_SERVER_ADDR}/posters/`;

        // Download posters and collect update operations
        for (const show of shows) {
            // Download show poster
            if (show.posterPath) {
                const showPosterID = show.posterPath.substring(show.posterPath.lastIndexOf('/') + 1, show.posterPath.lastIndexOf('.'));
                await downloadPoster(show.posterPath, showPosterID);
            }

            // Iterate through each season and episode to download posters
            for (const season of show.seasons) {
                for (const episode of season.episodes) {
                    if (episode.poster) {
                        const episodePosterID = episode.poster.substring(episode.poster.lastIndexOf('/') + 1, episode.poster.lastIndexOf('.'));
                        await downloadPoster(episode.poster, episodePosterID);
                    }
                }
            }
        }

        // Update poster URLs in MongoDB
        for (const show of shows) {
            // Update show poster URL
            if (show.posterPath) {
                show.posterPath = show.posterPath.replace(oldUrlPrefix, newUrlPrefix);
            }

            // Iterate through each season and episode to update URLs
            for (const season of show.seasons) {
                for (const episode of season.episodes) {
                    if (episode.poster) {
                        episode.poster = episode.poster.replace(oldUrlPrefix, newUrlPrefix);
                    }
                }
            }

            // Save updated show document
            await show.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error downloading posters:', error);
        res.status(500).json({ success: false, error: 'Failed to download posters' });
    }
});


// Function to delete posters
async function deletePoster(posterID) {
    try {
        const posterDirectory = `${process.env.HTTP_SERVER_MEDIA_DIR}/posters`;
        const posterPath = path.join(posterDirectory, `${posterID}.jpg`);
        if (fs.existsSync(posterPath)) {  // Check if the poster file exists at the constructed file path. This check prevents errors that would occur if the code tried to delete a non-existent file.
            fs.unlinkSync(posterPath); // If the file exists, delete the file using the synchronous unlink method. If the file exists, this line deletes it using the fs.unlinkSync method. 
        }
        return true;
    } catch (error) {
        console.error('Error deleting poster:', error);
        return false;
    }
}

// Endpoint to delete movie posters
router.get('/delete-movies-posters', async (req, res) => {
    try {
        // Fetch all movies posters
        const movies = await Movies.find({}, 'posterPath');

        // Delete movies posters and collect update operations
        for (const movie of movies) {
            const posterURL = movie.posterPath;
            const moviePosterID = posterURL.substring(posterURL.lastIndexOf('/') + 1, posterURL.lastIndexOf('.'));
            await deletePoster(moviePosterID);
        }

        // Update poster URLs in the database
        const oldUrlPrefix = `${process.env.HTTP_SERVER_ADDR}/posters/`;
        const newUrlPrefix = 'https://image.tmdb.org/t/p/original/';

        for (const movie of movies) {
            const newPosterUrl = movie.posterPath.replace(oldUrlPrefix, newUrlPrefix);
            await Movies.updateOne({ _id: movie._id }, { posterPath: newPosterUrl });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting posters:', error);
        res.status(500).json({ success: false, error: 'Failed to delete posters' });
    }
});

router.get('/delete-shows-and-episodes-posters', async (req, res) => {
    try {
        // Fetch all shows with their episodes
        const shows = await Shows.find({}, 'posterPath seasons');

        const oldUrlPrefix = `${process.env.HTTP_SERVER_ADDR}/posters/`;
        const newUrlPrefix = 'https://image.tmdb.org/t/p/original/';

        // Delete posters and collect update operations
        for (const show of shows) {
            // Delete show poster
            if (show.posterPath) {
                const showPosterID = show.posterPath.substring(show.posterPath.lastIndexOf('/') + 1, show.posterPath.lastIndexOf('.'));
                await deletePoster(showPosterID);
            }

            // Iterate through each season and episode to delete posters
            for (const season of show.seasons) {
                for (const episode of season.episodes) {
                    if (episode.poster) {
                        const episodePosterID = episode.poster.substring(episode.poster.lastIndexOf('/') + 1, episode.poster.lastIndexOf('.'));
                        await deletePoster(episodePosterID);
                    }
                }
            }
        }

        // Update poster URLs in MongoDB
        for (const show of shows) {
            // Update show poster URL
            if (show.posterPath) {
                show.posterPath = show.posterPath.replace(oldUrlPrefix, newUrlPrefix);
            }

            // Iterate through each season and episode to update URLs
            for (const season of show.seasons) {
                for (const episode of season.episodes) {
                    if (episode.poster) {
                        episode.poster = episode.poster.replace(oldUrlPrefix, newUrlPrefix);
                    }
                }
            }

            // Save updated show document
            await show.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting posters:', error);
        res.status(500).json({ success: false, error: 'Failed to delete posters' });
    }
});

module.exports = router;