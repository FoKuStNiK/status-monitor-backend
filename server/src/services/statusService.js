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
        SELECT id, status, timestamp, details
        FROM statuses
        ${where}
        ORDER BY id ASC
    `).all(...params);
}

function upsertStatus({ id, status, timestamp, details }) {
    const existing = db.prepare(`
        SELECT id, status, timestamp, details
        FROM statuses
        WHERE id = ?
    `).get(id);

    // Не даём более старому событию затереть уже сохранённое новое состояние.
    if (existing && existing.timestamp > timestamp) {
        return {
            record: existing,
            updated: false,
            reason: 'older-event'
        };
    }

    const hasNewDetails =
        typeof details === 'string' &&
        details.trim() !== '';

    const nextDetails = hasNewDetails
        ? details
        : existing?.details ?? null;

    db.prepare(`
        INSERT INTO statuses (
            id,
            status,
            timestamp,
            details
        )
        VALUES (?, ?, ?, ?)

        ON CONFLICT(id) DO UPDATE SET
            status = excluded.status,
            timestamp = excluded.timestamp,
            details = excluded.details
    `).run(
        id,
        status,
        timestamp,
        nextDetails
    );

    const record = db.prepare(`
        SELECT id, status, timestamp, details
        FROM statuses
        WHERE id = ?
    `).get(id);

    return {
        record,
        updated: true
    };
}

module.exports = {
    getStatuses,
    upsertStatus
};
