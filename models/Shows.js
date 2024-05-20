const mongoose = require('mongoose');

const showsSchema = new mongoose.Schema({
    name: String,
    overview: String,
    genres: [String],
    posterPath: String,
    releaseDate: Date,
    ratings: Number,
    seasons: [{
        season_number: Number,
        episodes: [{
            episode_number: Number,
            name: String,
            runtime: Number,
            overview: String,
            poster: String,  // Add poster path if available
            downloadLink: String
        }]
    }]
});

const Shows = mongoose.model('Shows', showsSchema);

module.exports = Shows;
