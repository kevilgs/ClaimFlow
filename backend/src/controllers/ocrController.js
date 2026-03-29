const { extractReceiptData } = require('../services/ocrService');

const processOcr = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const data = await extractReceiptData(req.file.buffer);
        return res.json({ success: true, data });
    } catch (err) {
        console.error('OCR error:', err);
        return res.status(500).json({ error: 'OCR processing failed', detail: err.message });
    }
};

module.exports = { processOcr };
