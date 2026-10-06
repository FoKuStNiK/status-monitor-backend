const express = require('express');
const { receiveWebhook } = require('../controllers/webhookController');
const { checkWebhookToken } = require('../middleware/checkWebhookToken');

const router = express.Router();

router.post('/', checkWebhookToken, receiveWebhook);

module.exports = router;
