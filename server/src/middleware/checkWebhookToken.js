function checkWebhookToken(req, res, next) {
    const expectedToken = process.env.WEBHOOK_TOKEN;
    const token = req.headers['token'];

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
