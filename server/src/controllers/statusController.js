const { STATUSES } = require('../constants/statuses');
const statusService = require('../services/statusService');

function getStatuses(req, res) {
    const filters = {};

    if (req.query.id !== undefined && req.query.id !== '') {
        const id = Number(req.query.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'id должен быть положительным целым числом'
            });
        }
        filters.id = id;
    }

    if (req.query.status) {
        if (!STATUSES.includes(req.query.status)) {
            return res.status(400).json({
                success: false,
                message: 'Неизвестный status',
                allowedStatuses: STATUSES
            });
        }
        filters.status = req.query.status;
    }

    const data = statusService.getStatuses(filters);
    return res.json(data);
}

module.exports = { getStatuses };
