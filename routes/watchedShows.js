const express = require('express');
const router = express.Router();
const isLoggedIn = require('../routes/isLoggedin')
const Shows = require('../models/Shows')

router.get('/all-watched-shows', isLoggedIn, async (req, res) => {
    try {
        const user = req.user;
        const shows = await Shows.find();

        // Fetch all shows with their watched times
        const watchedShows = await Promise.all(user.watchedShows.map(async ({ _id, episode, watchedTime, uploadTime }) => {
            let episodeInfo = null;

            // Iterate through all shows and their seasons to find the specific episode
            for (const show of shows) {
                for (const season of show.seasons) {
                    const foundEpisode = season.episodes.find(ep => ep._id.toString() === episode.toString());
                    if (foundEpisode) {
                        episodeInfo = {
                            showId: show._id,
                            episodeID: episode,
                            showName: show.name,
                            seasonNumber: season.season_number,
                            showPoster: show.posterPath,
                            episodeNumber: foundEpisode.episode_number,
                            episodePoster: foundEpisode.poster,
                            episodeRuntime: foundEpisode.runtime,
                            episodeLink: foundEpisode.downloadLink,
                            episodeName: foundEpisode.name
                        };
                        break;
                    }

                }

                if (episodeInfo) {
                    break;
                }
            }

            return {
                id: _id,
                episodeInfo,
                watchedTime,
                uploadTime,
            };
        }));

        // Sort the watchedShows based on the uploadTime in descending order
        watchedShows.sort((a, b) => b.uploadTime - a.uploadTime);

        res.json({ success: true, watchedShows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});



router.post('/update-shows-watched-time/:episodeID', isLoggedIn, async (req, res) => {
    try {
        const user = req.user;
        const episodeID = req.params.episodeID;
        const watchedTime = req.body.watchedTime; // Assuming you send the watched time in the request body
        const episodeShowID = req.body.showID;

        // Find the show in the user's watchedShows and update the watched time
        const episodeToUpdate = user.watchedShows.find(item => item.episode.equals(episodeID));
        if (episodeToUpdate) {
            episodeToUpdate.watchedTime = watchedTime;
            episodeToUpdate.uploadTime = Date.now();
        } else {

            user.watchedShows.push({ episode: episodeID, showID: episodeShowID, watchedTime, uploadTime: Date.now() });
        }

        await user.save();
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


router.get('/get-show-watchtime/:episodeID', isLoggedIn, async (req, res) => {
    try {
        const user = req.user;
        const episodeID = req.params.episodeID;

        // Find the episode in the watchedShows array
        const watchedEpisode = user.watchedShows.find(item => item.episode.equals(episodeID));

        if (watchedEpisode) {
            res.json({ success: true, watchedTime: watchedEpisode.watchedTime });
        } else {
            res.status(404).json({ success: false, message: 'Episode not found in watchedShows' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/remove-watched-show/:episodeID', isLoggedIn, async (req, res) => {
    try {
        const user = req.user;
        const episodeID = req.params.episodeID;

        // Find the index of the episode in the watchedShows array
        const indexToRemove = user.watchedShows.findIndex(item => item.episode.equals(episodeID));

        if (indexToRemove !== -1) {
            // Remove the episode from the array if found
            user.watchedShows.splice(indexToRemove, 1);
            await user.save();
            res.json({ success: true, user });
        } else {
            res.status(404).json({ success: false, message: 'Episode not found in watchedShows' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


router.get('/episode-info/:episodeId', async (req, res) => {
    try {
        const episodeId = req.params.episodeId;

        // Find the episode in your data
        const shows = await Shows.find(); // Retrieve shows from your database
        let seasonArray = null;
        let showID = null;

        for (const show of shows) {
            for (const season of show.seasons) {
                const foundEpisode = season.episodes.find(ep => ep._id.toString() === episodeId);

                if (foundEpisode) {
                    seasonArray = season.episodes;
                    showID = show._id
                    break;
                }
            }

            if (seasonArray) {
                break;
            }
        }

        if (seasonArray) {
            res.json({ success: true, showID, seasonArray });
        } else {
            res.status(404).json({ success: false, message: 'Episode not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// This will generate the latest episode ID watched by the user from a particular show
router.get('/get-latest-watched-episodeID/:showID', isLoggedIn, async (req, res) => {
    try {
        const { showID } = req.params;
        const user = req.user;
        const watchedShows = user.watchedShows.filter(show => show.showID.toString() === showID);
        if (watchedShows.length === 0) {
            return res.json({ episodeID: null });
        }

        // Sort watched episodes by uploadTime in descending order
        watchedShows.sort((a, b) => b.uploadTime - a.uploadTime);

        // Get the episodeID of the latest episode
        const latestEpisodeID = watchedShows[0].episode;

        res.json({ episodeID: latestEpisodeID });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;