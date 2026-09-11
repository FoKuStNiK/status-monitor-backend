CREATE TABLE IF NOT EXISTS statuses (
    id INTEGER PRIMARY KEY,
    status TEXT NOT NULL CHECK (
        status IN ('started', 'not connected', 'connected', 'worked', 'finished', 'error')
    ),
    timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_statuses_status ON statuses(status);
