const { createWorker } = require('tesseract.js');
const sharp = require('sharp');
const chrono = require('chrono-node');

const CATEGORY_KEYWORDS = {
    Travel: ['uber', 'ola', 'flight', 'airline', 'train', 'irctc', 'taxi', 'toll', 'petrol'],
    Meals: ['restaurant', 'cafe', 'coffee', 'starbucks', 'zomato', 'swiggy', 'food', 'lunch'],
    Accommodation: ['hotel', 'inn', 'lodge', 'airbnb', 'oyo', 'room', 'stay'],
    'Office Supplies': ['stationery', 'pen', 'paper', 'printer', 'ink', 'notebook'],
    Equipment: ['laptop', 'monitor', 'keyboard', 'mouse', 'hardware', 'device'],
    Software: ['subscription', 'license', 'saas', 'software', 'aws', 'azure', 'google cloud'],
    'Professional Services': ['consultant', 'lawyer', 'accountant', 'audit', 'legal'],
    Utilities: ['electricity', 'internet', 'broadband', 'phone', 'mobile', 'water', 'gas'],
    Maintenance: ['repair', 'service', 'maintenance', 'cleaning', 'plumber']
};

const CURRENCY_MAP = {
    '$': 'USD', '€': 'EUR', '£': 'GBP', '₹': 'INR',
    '¥': 'JPY', 'Rs': 'INR', 'INR': 'INR',
    'usd': 'USD', 'eur': 'EUR', 'gbp': 'GBP', 'thb': 'THB'
};

async function preprocessImage(inputBuffer) {
    return await sharp(inputBuffer)
        .greyscale()
        .normalize()
        .sharpen()
        .resize({ width: 1500, withoutEnlargement: true })
        .toBuffer();
}

function extractAmount(text) {
    // Pull every decimal number from the text
    const numbers = [...text.matchAll(/\b\d+[\.,]\d{2}\b|\b\d+\b/g)]
        .map(m => parseFloat(m[0].replace(',', '.')))
        .filter(n => !isNaN(n) && n < 1000000);

    if (numbers.length === 0) return null;
    return Math.max(...numbers);
}

function extractCurrency(text) {
    const lower = text.toLowerCase();
    for (const [symbol, code] of Object.entries(CURRENCY_MAP)) {
        if (lower.includes(symbol.toLowerCase())) return code;
    }
    return null;
}

function extractDate(text) {
    const parsed = chrono.parseDate(text);
    if (parsed) return parsed.toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
}

function extractMerchant(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return lines[0] || 'Unknown Merchant';
}

function extractCategory(text) {
    const lower = text.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) return category;
    }
    return 'Other';
}

async function extractReceiptData(imageBuffer) {
    const processedBuffer = await preprocessImage(imageBuffer);

    const worker = await createWorker('eng');
    await worker.setParameters({
        tesseract_pageseg_mode: '6'
    });

    const { data: { text } } = await worker.recognize(processedBuffer);
    await worker.terminate();

    const amount = extractAmount(text);
    const currency = extractCurrency(text);
    const date = extractDate(text);
    const merchant = extractMerchant(text);
    const category = extractCategory(text);

    return {
        amount,
        currency,
        date,
        description: merchant,
        category,
        raw_text: text,
    };
}

module.exports = { extractReceiptData };
