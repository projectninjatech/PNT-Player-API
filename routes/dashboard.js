// dashboard.js
require('dotenv').config();
const express = require('express');
const router = express.Router();

function isAdminAuthenticated(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.redirect('/admin/login');
}

router.get('/', isAdminAuthenticated, (req, res) => {
  const user = req.user;
  console.log("Dashboard", user);
  res.render('dashboard'); // Assuming you have a dashboard view
});

router.get('/addMovieRoute', isAdminAuthenticated, (req, res) => {
  // res.render('addMovie.hbs');
  res.render('addMovieList.hbs');
});

router.get('/updateMovieRoute', isAdminAuthenticated, (req, res) => {
  res.redirect('/edit-movie-list'); // Assuming you have an updateMovie view
});

router.get('/deleteMovieRoute', isAdminAuthenticated, (req, res) => {
  res.redirect('/delete-movie');
});


router.get('/addShowsRoute', isAdminAuthenticated, (req, res) => {
  res.render('addShowsList.hbs');
});

router.get('/updateShowsRoute', isAdminAuthenticated, (req, res) => {
  res.redirect('/edit-shows-list');
});

router.get('/deleteShowsRoute', isAdminAuthenticated, (req, res) => {
  res.redirect('/delete-show');
});

router.get('/poster-link-update', isAdminAuthenticated, (req, res) => {
  res.render('managePosters.hbs');
});

module.exports = router;
