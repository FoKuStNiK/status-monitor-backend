const statuses = [
    'started',
    'not connected',
    'connected',
    'worked',
    'finished',
    'error'
];

const baseUrl = process.env.API_URL || 'http://localhost:5000';

async function send(id, status) {
    const response = await fetch(`${baseUrl}/api/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id,
            status,
            timestamp: new Date().toISOString()
        })
    });

    const body = await response.json();
    console.log(`${response.status} | id=${id} | ${status}`, body.success ? '✅' : body);
}

async function main() {
    for (let id = 1; id <= 12; id++) {
        const status = statuses[(id - 1) % statuses.length];
        await send(id, status);
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
