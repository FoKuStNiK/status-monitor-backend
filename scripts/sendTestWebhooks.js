const statuses = [
    'started',
    'not connected',
    'connected',
    'worked',
    'finished',
    'error'
];

const baseUrl = process.env.API_URL || 'http://localhost:5000';

const TOTAL_REQUESTS = 50;
const INTERVAL_MS = 200; // 5 запросов в секунду

async function send(id, status) {
    const response = await fetch(`${baseUrl}/api/webhook`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id,
            status,
            timestamp: new Date().toISOString()
        })
    });

    const body = await response.json();

    console.log(
        `${response.status} | id=${id} | status=${status}`,
        body.success ? '✅' : body
    );
}

async function main() {
    console.log('Начало теста');
    console.log('50 запросов за 10 секунд');
    console.log('Скорость: 5 запросов в секунду\n');

    const startTime = Date.now();
    const requests = [];

    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        const id = i + 1;
        const status = statuses[i % statuses.length];

        requests.push(send(id, status));

        await new Promise(resolve =>
            setTimeout(resolve, INTERVAL_MS)
        );
    }

    await Promise.all(requests);

    const elapsedSeconds =
        (Date.now() - startTime) / 1000;

    console.log('\nТест завершён');
    console.log(`Отправлено запросов: ${TOTAL_REQUESTS}`);
    console.log(`Время: ${elapsedSeconds.toFixed(2)} сек.`);
}

main().catch(error => {
    console.error('Ошибка теста:', error);
    process.exit(1);
});