require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors');
const bodyParser = require('body-parser');
app.set('view engine', 'hbs');
const port = process.env.PORT

// Connect to MongoDB database
const mongoose = require('mongoose'); // Import Mongoose library for MongoDB interactions
mongoose.connect(process.env.MONGO_DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }); // Connect to MongoDB using the provided URL
const db = mongoose.connection; // Reference to MongoDB connection

// Set up session management with Express
const session = require('express-session'); // Import express-session middleware for session management
const User = require('./models/User')
const MongoStore = require('connect-mongo') // Use connect-mongo to store sessions in MongoDB
app.use(session({
    secret: 'abcd1234', // Secret key used to sign the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored
    store: new MongoStore({ mongoUrl: process.env.MONGO_DB_URL }), // Store sessions in MongoDB
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week (adjust as needed)
    },
}));

// Set up Passport.js for user authentication
const passport = require('passport'); // Import Passport.js library for authentication
const LocalStrategy = require('passport-local').Strategy; // Import Passport Local Strategy for username/password authentication
app.use(passport.initialize()); // Initialize Passport middleware
app.use(passport.session()); // Use Passport middleware for session management
passport.use(new LocalStrategy(User.authenticate())); // Use local strategy for authentication
passport.serializeUser(User.serializeUser()); // Serialize user data for storage in session
passport.deserializeUser(User.deserializeUser()); // Deserialize user data from session

// Serve static files from the 'public' directory
const path = require('path'); // Import path module
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

app.use(cors()); // Enable Cross-Origin Resource Sharing
// Parse incoming requests with JSON payload
app.use(bodyParser.json()); // Parse JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies with extended mode
const Movie = require('./models/movie')

// Handle MongoDB connection errors
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

const dashboard = require('./routes/dashboard')
const addMovie = require('./routes/addMovie')
const updateMovieRoute = require('./routes/updateMovie')
const deleteMovie = require('./routes/deleteMovie')
const getMovies = require('./routes/getMovies')
const authRoutes = require('./routes/authRoutes')
const myList = require('./routes/mylist')
const watcheMovie = require('./routes/watchedMovie')
const scanAllMovies = require('./routes/scanAllMovies')

const addShows = require('./routes/addShows')
const updateShows = require('./routes/updateShows')
const deleteShow = require('./routes/deleteShow')
const scanAllShows = require('./routes/scanAllShows')
const getShows = require('./routes/getShows')
const watchedShows = require('./routes/watchedShows')
const showsMylist = require('./routes/showsMylist')
const managePosters = require('./routes/managePosters')
const checkCon = require('./routes/checkcon')

app.use('/', checkCon)
app.use('/', dashboard)
app.use('/', addMovie)
app.use('/', updateMovieRoute)
app.use('/', deleteMovie)
app.use('/', getMovies)
app.use('/', authRoutes)
app.use('/', myList)
app.use('/', watcheMovie)
app.use('/', scanAllMovies)

app.use('/', addShows)
app.use('/', updateShows)
app.use('/', deleteShow)
app.use('/', scanAllShows)
app.use('/', getShows)
app.use('/', watchedShows)
app.use('/', showsMylist)
app.use('/', managePosters)

app.listen(port, '0.0.0.0', () => {
    console.log(`API is running on port ${port}`)
    console.log(`For Android emulator, use http://10.0.2.2:${port}`)
})