const { WebSocketServer, WebSocket } = require('ws');

let wssInstance = null;
let heartbeatInterval = null;

function initStatusSocket(server) {
    wssInstance = new WebSocketServer({ server, path: '/ws' });

    wssInstance.on('connection', socket => {
        socket.isAlive = true;
        console.log('🔌 WebSocket клиент подключён');

        socket.on('pong', () => {
            socket.isAlive = true;
        });

        socket.on('close', () => {
            console.log('🔌 WebSocket клиент отключён');
        });

        socket.on('error', error => {
            console.error('WebSocket ошибка:', error.message);
        });
    });

    heartbeatInterval = setInterval(() => {
        if (!wssInstance) return;

        for (const socket of wssInstance.clients) {
            if (socket.isAlive === false) {
                socket.terminate();
                continue;
            }

            socket.isAlive = false;
            socket.ping();
        }
    }, 30000);

    wssInstance.on('close', () => {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
    });

    return wssInstance;
}

function broadcastStatusUpdate(record) {
    if (!wssInstance) return;

    const message = JSON.stringify({
        type: 'status:updated',
        data: record
    });

    for (const client of wssInstance.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

module.exports = {
    initStatusSocket,
    broadcastStatusUpdate
};
