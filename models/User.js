const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    isAdmin: {
        type: Boolean,
        default: false, // Default value is false for regular users
    },
    mylist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie'
    }],

    showsMylist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shows'
    }],

    watchedMovies: [{
        movie: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Movie',
        },
        watchedTime: {
            type: Number,
            default: 0,
        },
        uploadTime: {
            type: Date,
            default: Date.now,
        },
    }],

    watchedShows: [{
        episode: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shows',
        },
        showID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shows',
        },
        watchedTime: {
            type: Number,
            default: 0,
        },
        uploadTime: {
            type: Date,
            default: Date.now,
        },
    }],
});

// Add passport-local-mongoose plugin to handle user authentication
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

module.exports = User;