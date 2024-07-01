require('dotenv').config();
const express = require('express');
const router = express.Router();
const Shows = require('../models/Shows');
const Movies = require('../models/movie')
const axios = require('axios');
const fs = require('fs');
const path = require('path');


// Function to download poster or backdrop
async function downloadImage(imageURL, imageID, name, count, res) {
    try {
        const response = await axios.get(imageURL, {
            responseType: 'stream'
        });

        const directory = `${process.env.HTTP_SERVER_MEDIA_DIR}/posters`;
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }
        const imagePath = path.join(directory, `${imageID}.jpg`);
        response.data.pipe(fs.createWriteStream(imagePath));

        return new Promise((resolve, reject) => {
            response.data.on('end', () => {
                res.write(`data: ${JSON.stringify({ status: 'downloaded', count: count, name: name })}\n\n`);
                resolve();
            });

            response.data.on('error', (err) => {
                reject(err);
            });
        });
    } catch (error) {
        console.error(`Error downloading :`, error);
        return null;
    }
}


router.get('/download-movies-posters', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish Server Side Events(SSE) with the client
    try {
        // Fetch all movies with their poster and backdrop URLs
        const movies = await Movies.find({}, 'posterPath backdropPath title');
        console.log("Movie posterPath & backdropPath", movies);
        var count = 0;
        for (const movie of movies) {
            const title = movie.title
            const posterURL = movie.posterPath;
            const posterID = posterURL.substring(posterURL.lastIndexOf('/') + 1, posterURL.lastIndexOf('.'));
            const backdropURL = movie.backdropPath;
            const backdropID = backdropURL.substring(backdropURL.lastIndexOf('/') + 1, backdropURL.lastIndexOf('.'));

            // Download poster and backdrop
            await downloadImage(posterURL, posterID, title, count, res);
            await downloadImage(backdropURL, backdropID, title, count, res);
            count++;
        }

        // Update URLs in the database
        const oldUrlPrefix = 'https://image.tmdb.org/t/p/original/';
        const newUrlPrefix = `${process.env.HTTP_SERVER_ADDR}/posters/`;

        for (const movie of movies) {
            const newPosterUrl = movie.posterPath.replace(oldUrlPrefix, newUrlPrefix);
            const newBackdropUrl = movie.backdropPath.replace(oldUrlPrefix, newUrlPrefix);

            await Movies.updateOne({ _id: movie._id }, {
                posterPath: newPosterUrl,
                backdropPath: newBackdropUrl
            });
        }

        res.write('data: {"status": "complete"}\n\n');
        res.end();

        // res.json({ success: true });
    } catch (error) {
        console.error('Error downloading movie posters and backdrops:', error);
        res.status(500).json({ success: false, error: 'Failed to download movie posters and backdrops' });
    }
});

router.get('/movie-count', async (req, res) => {
    try {
        const count = await Movies.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error('Error fetching movie count:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch movie count' });
    }
});


router.get('/download-shows-posters', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with the client
    try {
        // Fetch all shows with their episodes
        const shows = await Shows.find({}, 'name posterPath backdropPath seasons');

        const oldUrlPrefix = 'https://image.tmdb.org/t/p/original/';
        const newUrlPrefix = `${process.env.HTTP_SERVER_ADDR}/posters/`;

        // Download posters and collect update operations
        var count = 0;
        for (const show of shows) {
            const showName = show.name
            // Download show poster
            if (show.posterPath) {
                const showPosterID = show.posterPath.substring(show.posterPath.lastIndexOf('/') + 1, show.posterPath.lastIndexOf('.'));
                await downloadImage(show.posterPath, showPosterID, showName, count, res);
            }

            if (show.backdropPath) {
                const showBackdropID = show.backdropPath.substring(show.backdropPath.lastIndexOf('/') + 1, show.backdropPath.lastIndexOf('.'));
                await downloadImage(show.backdropPath, showBackdropID, showName, count, res);
            }

            // Iterate through each season and episode to download posters
            for (const season of show.seasons) {
                for (const episode of season.episodes) {
                    if (episode.poster) {
                        const episodePosterID = episode.poster.substring(episode.poster.lastIndexOf('/') + 1, episode.poster.lastIndexOf('.'));
                        await downloadImage(episode.poster, episodePosterID, episode.name, count, res);
                    }
                }
            }
            count++;
        }

        // Update poster URLs in MongoDB
        for (const show of shows) {
            // Update show poster URL
            if (show.posterPath) {
                show.posterPath = show.posterPath.replace(oldUrlPrefix, newUrlPrefix);
            }

            if (show.backdropPath) {
                show.backdropPath = show.backdropPath.replace(oldUrlPrefix, newUrlPrefix);
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

        res.write('data: {"status": "complete"}\n\n');
        res.end();

        // res.json({ success: true });
    } catch (error) {
        console.error('Error downloading posters:', error);
        res.status(500).json({ success: false, error: 'Failed to download posters' });
    }
});

router.get('/shows-count', async (req, res) => {
    try {
        const count = await Shows.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error('Error fetching shows count:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch shows count' });
    }
});


// Function to delete posters
async function deletePoster(posterID, name, count, res) {
    try {
        const posterDirectory = `${process.env.HTTP_SERVER_MEDIA_DIR}/posters`;
        const posterPath = path.join(posterDirectory, `${posterID}.jpg`);
        if (fs.existsSync(posterPath)) {
            fs.unlinkSync(posterPath);
            res.write(`data: ${JSON.stringify({ status: 'deleted', name: name, count: count })}\n\n`);
        } else {
            res.write(`data: ${JSON.stringify({ status: 'not_found' })}\n\n`);
        }
        return true;
    } catch (error) {
        console.error('Error deleting poster:', error);
        return false;
    }
}

// Endpoint to delete movie posters
router.get('/delete-movies-posters', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with the client
    try {
        // Fetch all movies posters
        const movies = await Movies.find({}, 'title posterPath backdropPath');

        // Delete movies posters and collect update operations
        var count = 0;
        for (const movie of movies) {
            const title = movie.title
            const posterURL = movie.posterPath;
            const moviePosterID = posterURL.substring(posterURL.lastIndexOf('/') + 1, posterURL.lastIndexOf('.'));
            const backdropURL = movie.backdropPath;
            const backdropID = backdropURL.substring(backdropURL.lastIndexOf('/') + 1, backdropURL.lastIndexOf('.'));
            await deletePoster(moviePosterID, title, count, res);
            await deletePoster(backdropID, title, count, res);
            count++;
        }

        // Update poster URLs in the database
        const oldUrlPrefix = `${process.env.HTTP_SERVER_ADDR}/posters/`;
        const newUrlPrefix = 'https://image.tmdb.org/t/p/original/';

        for (const movie of movies) {
            const newPosterUrl = movie.posterPath.replace(oldUrlPrefix, newUrlPrefix);
            const newBackdropUrl = movie.backdropPath.replace(oldUrlPrefix, newUrlPrefix);
            await Movies.updateOne({ _id: movie._id }, { posterPath: newPosterUrl, backdropPath: newBackdropUrl });
        }

        res.write('data: {"status": "complete"}\n\n');
        res.end();
        // res.json({ success: true });
    } catch (error) {
        console.error('Error deleting posters:', error);
        res.status(500).json({ success: false, error: 'Failed to delete posters' });
    }
});

router.get('/delete-shows-and-episodes-posters', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with the client
    try {
        // Fetch all shows with their episodes
        const shows = await Shows.find({}, 'name posterPath backdropPath seasons');

        const oldUrlPrefix = `${process.env.HTTP_SERVER_ADDR}/posters/`;
        const newUrlPrefix = 'https://image.tmdb.org/t/p/original/';

        // Delete posters and collect update operations
        var count = 0;
        for (const show of shows) {
            const showName = show.name
            // Delete show poster
            if (show.posterPath) {
                const showPosterID = show.posterPath.substring(show.posterPath.lastIndexOf('/') + 1, show.posterPath.lastIndexOf('.'));
                await deletePoster(showPosterID, showName, count, res);
            }

            if (show.backdropPath) {
                const showBackdropID = show.backdropPath.substring(show.backdropPath.lastIndexOf('/') + 1, show.backdropPath.lastIndexOf('.'));
                await deletePoster(showBackdropID, showName, count, res);
            }

            // Iterate through each season and episode to delete posters
            for (const season of show.seasons) {
                for (const episode of season.episodes) {
                    if (episode.poster) {
                        const episodePosterID = episode.poster.substring(episode.poster.lastIndexOf('/') + 1, episode.poster.lastIndexOf('.'));
                        await deletePoster(episodePosterID, showName, count, res);
                    }
                }
            }

            count++;
        }

        // Update poster URLs in MongoDB
        for (const show of shows) {
            // Update show poster URL
            if (show.posterPath) {
                show.posterPath = show.posterPath.replace(oldUrlPrefix, newUrlPrefix);
            }

            if (show.backdropPath) {
                show.backdropPath = show.backdropPath.replace(oldUrlPrefix, newUrlPrefix);
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

        res.write('data: {"status": "complete"}\n\n');
        res.end();
        // res.json({ success: true });
    } catch (error) {
        console.error('Error deleting posters:', error);
        res.status(500).json({ success: false, error: 'Failed to delete posters' });
    }
});

module.exports = router;