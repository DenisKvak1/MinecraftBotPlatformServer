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
    // const topBuyers = findTopBuyers(buyData);
    // console.log('Топ 10 игроков по количеству покупок:');
    // topBuyers.forEach((buyer, index) => {
    //     console.log(`${index + 1}. ${buyer.playerName} - ${buyer.count} покупок`);
    // });
    calculateAveragePrices(buyData, sellData); // Вызов функции для подсчета средних цен

    // console.log(calculateHourlyProfitForDay(buyData, sellData, '2024-07-01'))
    // analyzeTopItemsByProfit(buyData, sellData, '2024-09-14T00:00:00Z', '2024-09-14T23:59:59Z')
});

function calculateHourlyProfitForDay(buyData, sellData, day) {
    const profitByHour = {};

    // Инициализируем объект с ключами от 0 до 23
    for (let hour = 0; hour < 24; hour++) {
        profitByHour[hour] = 0;
    }

    // Приводим день к началу UTC формата 'YYYY-MM-DD'
    const dayStart = new Date(day + 'T00:00:00Z');
    const dayEnd = new Date(day + 'T23:59:59Z'); // Конец указанного дня

    // Функция для добавления прибыли к определённому часу
    function addProfit(hour, amount) {
        profitByHour[hour+3] += amount;
    }

    // Обрабатываем покупки (расходы)
    buyData.forEach(buy => {
        const date = new Date(buy.timestamp);

        // Проверяем, принадлежит ли дата указанному дню
        if (date >= dayStart && date <= dayEnd) {
            const hour = date.getUTCHours(); // Получаем час от 0 до 23

            // Общая стоимость покупки (цена за единицу * количество)
            const totalCost = buy.price * buy.quantity;

            // Учитываем это как отрицательная прибыль (затраты)
            addProfit(hour, -totalCost);
        }
    });

    // Обрабатываем продажи (доходы)
    sellData.forEach(sell => {
        const date = new Date(sell.timestamp);

        // Проверяем, принадлежит ли дата указанному дню
        if (date >= dayStart && date <= dayEnd) {
            const hour = date.getUTCHours(); // Получаем час от 0 до 23

            // Общая стоимость продажи (цена за единицу * количество)
            const totalRevenue = sell.price * sell.quantity;

            // Учитываем это как положительная прибыль (доход)
            addProfit(hour, totalRevenue);
        }
    });

    return profitByHour;
}
function findTopBuyers(data) {
    // Создаем объект для подсчета количества покупок каждого игрока
    const playerPurchaseCount = {};

    // Подсчитываем количество покупок для каждого игрока
    data.forEach(entry => {
        if (playerPurchaseCount[entry.playerName]) {
            playerPurchaseCount[entry.playerName]++;
        } else {
            playerPurchaseCount[entry.playerName] = 1;
        }
    });

    // Преобразуем объект в массив и сортируем по количеству покупок
    const sortedPlayers = Object.entries(playerPurchaseCount)
        .sort((a, b) => b[1] - a[1]) // Сортируем по убыванию количества покупок
        .slice(0, 20); // Берем топ 10

    // Преобразуем массив обратно в объект для удобства
    const topBuyers = sortedPlayers.map(([playerName, count]) => ({
        playerName,
        count
    }));

    return topBuyers;
}
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
function calculateAveragePrices(buyData, sellData) {
    const buyMap = new Map();
    const sellMap = new Map();

    // Обработка данных покупок
    buyData.forEach(({ itemName, quantity, price }) => {
        if (!buyMap.has(itemName)) {
            buyMap.set(itemName, { totalQuantity: 0, totalPrice: 0 });
        }
        const item = buyMap.get(itemName);
        item.totalQuantity += quantity;
        item.totalPrice += price * quantity;
    });

    // Обработка данных продаж
    sellData.forEach(({ itemName, quantity, price }) => {
        if (!sellMap.has(itemName)) {
            sellMap.set(itemName, { totalQuantity: 0, totalPrice: 0 });
        }
        const item = sellMap.get(itemName);
        item.totalQuantity += quantity;
        item.totalPrice += price * quantity;
    });

    // Вывод средней цены для покупок
    console.log('Средняя цена покупки для каждого предмета:');
    buyMap.forEach((value, itemName) => {
        const avgPrice = value.totalPrice / value.totalQuantity;
        console.log(`${itemName}: Средняя цена покупки - ${avgPrice.toFixed(2)}`);
    });

    // Вывод средней цены для продаж
    console.log('Средняя цена продажи для каждого предмета:');
    sellMap.forEach((value, itemName) => {
        const avgPrice = value.totalPrice / value.totalQuantity;
        console.log(`${itemName}: Средняя цена продажи - ${avgPrice.toFixed(2)}`);
    });
}
