const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('app.log');

const buyData = [];
const sellData = [];

const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
});

const buyRegex = /(?<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[INFO\]: [\w-]+: Получил сообщение ▶ Вы успешно купили x(?<quantity>\d+) (?<itemName>.+?) у игрока (?<playerName>\w+) за (?<price>\d+)/;
const sellRegex = /(?<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[INFO\]: [\w-]+: Получил сообщение ▶ (?<playerName>\w+) купил (?<itemName>.+?) x(?<quantity>\d+) за (?<price>\d+)/;

rl.on('line', (log) => {
    let match = log.match(buyRegex);
    if (match) {
        const { quantity, itemName, playerName, price, timestamp } = match.groups;
        buyData.push({ quantity: +quantity, itemName, playerName, timestamp, price: +(price / quantity) });
    }

    match = log.match(sellRegex);
    if (match) {
        const { quantity, itemName, playerName, price, timestamp } = match.groups;
        sellData.push({ quantity: +quantity, itemName, playerName, timestamp, price: +(price / quantity) });
    }
});

rl.on('close', () => {
    analyzeTopItemsByProfit(buyData, sellData, '2024-09-14T00:00:00Z', '2024-09-14T23:59:59Z')
});

function analyzeTopItemsByProfit(buyData, sellData, startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const buyMap = new Map();
    const sellMap = new Map();
    const profitMap = new Map();

    // Фильтрация данных о покупках и заполняем buyMap
    buyData.forEach(({ quantity, itemName, price, timestamp }) => {
        const timestampMs = new Date(timestamp).getTime();
        if (timestampMs >= start && timestampMs <= end) {
            const totalCost = price * quantity;
            if (buyMap.has(itemName)) {
                buyMap.set(itemName, buyMap.get(itemName) + totalCost);
            } else {
                buyMap.set(itemName, totalCost);
            }
        }
    });

    // Фильтрация данных о продажах и заполняем sellMap
    sellData.forEach(({ quantity, itemName, price, timestamp }) => {
        const timestampMs = new Date(timestamp).getTime();
        if (timestampMs >= start && timestampMs <= end) {
            const totalRevenue = price * quantity;
            if (sellMap.has(itemName)) {
                sellMap.set(itemName, sellMap.get(itemName) + totalRevenue);
            } else {
                sellMap.set(itemName, totalRevenue);
            }
        }
    });

    // Вычисляем прибыль и заполняем profitMap
    sellMap.forEach((revenue, itemName) => {
        const cost = buyMap.get(itemName) || 0;
        const profit = revenue - cost;
        profitMap.set(itemName, profit);
    });

    // Сортируем profitMap по прибыли
    const sortedProfitItems = Array.from(profitMap.entries()).sort((a, b) => b[1] - a[1]);

    // Вывод результатов
    console.log('Топ предметов по прибыли за указанный период:');
    sortedProfitItems.forEach(([itemName, profit], index) => {
        console.log(`${index + 1}. ${itemName}: Прибыль ${profit}`);
    });

    // Подсчет и вывод общей стоимости покупок, доходов от продаж и общей прибыли
    const totalBuy = Array.from(buyMap.values()).reduce((acc, cost) => acc + cost, 0);
    const totalSell = Array.from(sellMap.values()).reduce((acc, revenue) => acc + revenue, 0);
    const totalProfit = sortedProfitItems.reduce((acc, [, profit]) => acc + profit, 0);

    console.log(`Общая стоимость покупки: ${totalBuy}`);
    console.log(`Общий доход от продажи: ${totalSell}`);
    console.log(`Общая прибыль: ${totalProfit}`);
}