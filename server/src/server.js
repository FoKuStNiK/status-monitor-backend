require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');

require('./db');

const statusRoutes = require('./routes/statusRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const { initStatusSocket } = require('./sockets/statusSocket');

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 5000;

const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

app.use('/api/statuses', statusRoutes);
app.use('/api/webhook', webhookRoutes);

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
