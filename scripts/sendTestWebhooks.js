const { STATUSES } = require('../server/src/constants/statuses');

const url = 'http://localhost:5000/api/webhook';

const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

const randomStatus = () =>
    STATUSES[Math.floor(Math.random() * STATUSES.length)];

const randomHex = length =>
    Array.from(
        { length },
        () => Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, '0')
    ).join('');

function createDetails() {
    const count = Math.floor(Math.random() * 6) + 10;

    const containers = Array.from(
        { length: count },
        (_, i) =>
            `Container ${i}: ${randomHex(20)}`
    );

    return [
        `Number of containers: ${count}`,
        ...containers,
        `Response body (containers ${count}): ${randomHex(50)}`,
        `Response CRC: 0x${randomHex(2).toUpperCase()}`
    ].join(' ');
}

async function main() {
    for (let i = 0; i < 50; i++) {
        const body = {
            id: i % 10 + 10,
            status: randomStatus(),
            timestamp: new Date().toISOString(),
            details: createDetails()
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        console.log(
            `${response.status} | id=${body.id} | ${body.status}`
        );

        await sleep(200);
    }
}

main();