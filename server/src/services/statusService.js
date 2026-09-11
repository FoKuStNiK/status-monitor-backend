const db = require('../db');

function getStatuses({ id, status } = {}) {
    const conditions = [];
    const params = [];

    if (id !== undefined) {
        conditions.push('id = ?');
        params.push(id);
    }

    if (status) {
        conditions.push('status = ?');
        params.push(status);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    return db.prepare(`
        SELECT id, status, timestamp
        FROM statuses
        ${where}
        ORDER BY id ASC
    `).all(...params);
}

function upsertStatus({ id, status, timestamp }) {
    const existing = db.prepare(
        'SELECT id, status, timestamp FROM statuses WHERE id = ?'
    ).get(id);

    // Не даём более старому событию затереть уже сохранённое новое состояние.
    if (existing && existing.timestamp > timestamp) {
        return { record: existing, updated: false, reason: 'older-event' };
    }

    db.prepare(`
        INSERT INTO statuses (id, status, timestamp)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            status = excluded.status,
            timestamp = excluded.timestamp
    `).run(id, status, timestamp);

    const record = db.prepare(
        'SELECT id, status, timestamp FROM statuses WHERE id = ?'
    ).get(id);

    return { record, updated: true };
}

module.exports = {
    getStatuses,
    upsertStatus
};
