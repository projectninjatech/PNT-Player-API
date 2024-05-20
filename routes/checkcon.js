const express = require('express');
const router = express.Router();

router.get('/check-con', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = router;