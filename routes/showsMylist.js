const express = require('express');
const router = express.Router();
const isLoggedIn = require('../routes/isLoggedin')
const Shows = require('../models/Shows')


router.post('/add-show-to-mylist/:showID', isLoggedIn, async (req, res) => {
    try {
        const user = req.user;
        user.showsMylist.push(req.params.showID);
        await user.save();
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/remove-show-from-mylist/:showID', isLoggedIn, async (req, res) => {
    try {
        const user = req.user;
        user.showsMylist = user.showsMylist.filter(showID => showID != req.params.showID);
        await user.save();
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/showsMylist', isLoggedIn, async (req, res) => {
    try {
        const user = req.user;
        
        // Populate the movie details using the movie IDs in the user's mylist
        const showsInMyList = await Shows.find({ _id: { $in: user.showsMylist } });

        res.json({ success: true, showsInMyList });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});



module.exports = router;