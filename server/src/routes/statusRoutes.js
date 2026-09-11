const express = require('express');
const { getStatuses } = require('../controllers/statusController');

const router = express.Router();
router.get('/', getStatuses);

module.exports = router;
