const { STATUSES } = require('../constants/statuses');
const statusService = require('../services/statusService');
const { broadcastStatusUpdate } = require('../sockets/statusSocket');

function receiveWebhook(req, res) {
    const { id, status, timestamp } = req.body ?? {};

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: 'id должен быть положительным целым числом'
        });
    }

    if (!STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Неизвестный status',
            allowedStatuses: STATUSES
        });
    }

    if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) {
        return res.status(400).json({
            success: false,
            message: 'timestamp должен быть корректной датой в строковом формате'
        });
    }

    const normalizedTimestamp = new Date(timestamp).toISOString();
    const result = statusService.upsertStatus({
        id,
        status,
        timestamp: normalizedTimestamp
    });

    if (result.updated) {
        broadcastStatusUpdate(result.record);
    }

    return res.status(200).json({
        success: true,
        updated: result.updated,
        data: result.record
    });
}

module.exports = { receiveWebhook };
