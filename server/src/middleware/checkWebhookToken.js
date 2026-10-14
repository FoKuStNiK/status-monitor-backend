function checkWebhookToken(req, res, next) {
    const expectedToken = process.env.WEBHOOK_TOKEN;
    const authHeader = req.headers['authorization'];

    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (!expectedToken) {
        return res.status(500).json({
            success: false,
            message: 'WEBHOOK_TOKEN не настроен на сервере'
        });
    }

    if (token !== expectedToken) {
        return res.status(401).json({
            success: false,
            message: 'Неверный token'
        });
    }

    next();
}

module.exports = { checkWebhookToken };