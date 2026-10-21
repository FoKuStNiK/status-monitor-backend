require('dotenv').config();

const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');

require('./db');

const statusRoutes = require('./routes/statusRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const { initStatusSocket } = require('./sockets/statusSocket');

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 5000;
const frontendBuildDir = path.resolve(__dirname, '../../frontend-build');

const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(process.env.FRONTEND_ORIGIN
        ? process.env.FRONTEND_ORIGIN.split(',').map(origin => origin.trim())
        : [])
]);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS: origin ${origin} is not allowed`));
    }
}));

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

app.use('/api/statuses', statusRoutes);
app.use('/api/webhook', webhookRoutes);

// In the Docker image, Express serves the compiled React application.
// API requests remain handled by their routes above, while WebSocket
// upgrade requests are handled by initStatusSocket on the HTTP server.
app.use(express.static(frontendBuildDir));

app.get(/.*/, (req, res, next) => {
    if (req.path === '/api' ||
        req.path.startsWith('/api/') ||
        req.path === '/ws' ||
        !req.accepts('html')) {
        return next();
    }

    return res.sendFile(path.join(frontendBuildDir, 'index.html'));
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
    });
});

initStatusSocket(server);

server.listen(PORT, () => {
    console.log(`✅ HTTP сервер: http://localhost:${PORT}`);
    console.log(`✅ WebSocket: ws://localhost:${PORT}/ws`);
});
