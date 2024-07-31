import { FuntimeCaptcha, HolyWorldCaptcha } from '../captchaConfig/captchaConfig';

export function getProfileAutobuy(server: string) {
	switch (server) {
		case 'mc.funtime.su':
			return funtimeAutoBuy
		case 'mc.holyworld.io':
			return holyworldAutoBuy
		case 'mc.holyworld.ru':
			return holyworldAutoBuy
	}
}
export type abProfile = {
	name: string,
	priceRegex: RegExp,
	updateIndex: number,
	shift: boolean
	interval: number,
	info: {
		[key: string]: {
			price: number
			sellprice?: any
		}
	}
}

export const holyworldAutoBuy:abProfile = {
	name: 'holyworld',
	"priceRegex": /(\d[\d\s]*)¤/,
	"updateIndex": 47,
	"interval": 200,
	"shift": false,
	"info": {
		"Poppy": {
			price: 11
		},
		"Gunpowder": {
			"price": 10000,
			"sellprice": ""
		},
	}
}

export const funtimeAutoBuy:abProfile = {
	name: 'funtime',
	"priceRegex": /\$\s*(\d[\d\s]*)/,
	"updateIndex": 49,
	"interval": 20,
	"shift": true,
	"info": {
		"Талисман Грани MAX": { "price": 1400000, "sellprice": "" },
		"Талисман Грани 2 LVL": { "price": 900000, "sellprice": "" },
		"Талисман Грани 1 LVL": { "price": 200000, "sellprice": "" },
		"Талисман Тритона MAX": { "price": 600000, "sellprice": "" },
		"Талисман Тритона 2 LVL": { "price": 300000, "sellprice": "" },
		"Талисман Тритона 1 LVL": { "price": 100000, "sellprice": "" },
		"Талисман Гармонии MAX": { "price": 2200000, "sellprice": "" },
		"Талисман Гармонии 2 LVL": { "price": 1900000, "sellprice": "" },
		"Талисман Гармонии 1 LVL": { "price": 800000, "sellprice": "" },
		"Талисман Феникса MAX": { "price": 1100000, "sellprice": "" },
		"Талисман Феникса 2 LVL": { "price": 400000, "sellprice": "" },
		"Талисман Феникса 1 LVL": { "price": 200000, "sellprice": "" },
		"Талисман Ехидны MAX": { "price": 2399999, "sellprice": "" },
		"Талисман Ехидны 2 LVL": { "price": 1300000, "sellprice": "" },
		"Талисман Ехидны 1 LVL": { "price": 500000, "sellprice": "" },
		"Талисман Дедала MAX": { "price": 5000000, "sellprice": "" },
		"Талисман Дедала 2 LVL": { "price": 2000000, "sellprice": "" },
		"Талисман Дедала 1 LVL": { "price": 1300000, "sellprice": "" },
		"Талисман Крушителя": { "price": 13000000, "sellprice": "" },
		"Талисман Карателя": { "price": 25000000, "sellprice": "" },
		"Сфера Андромеды MAX": { "price": 6000000, "sellprice": "" },
		"Сфера Андромеды 2 LVL": { "price": 3000000, "sellprice": "" },
		"Сфера Андромеды 1 LVL": { "price": 1400000, "sellprice": "" },
		"Сфера Пандора MAX": { "price": 2000000, "sellprice": "" },
		"Сфера Пандора 2 LVL": { "price": 900000, "sellprice": "" },
		"Сфера Пандора 1 LVL": { "price": 400000, "sellprice": "" },
		"Сфера Титана MAX": { "price": 3000000, "sellprice": "" },
		"Сфера Титана 2 LVL": { "price": 1300000, "sellprice": "" },
		"Сфера Титана 1 LVL": { "price": 900000, "sellprice": "" },
		"Сфера Аполлона MAX": { "price": 2000000, "sellprice": "" },
		"Сфера Аполлона 2 LVL": { "price": 1000000, "sellprice": "" },
		"Сфера Аполлона 1 LVL": { "price": 300000, "sellprice": "" },
		"Сфера Астрея MAX": { "price": 700000, "sellprice": "" },
		"Сфера Астрея 2 LVL": { "price": 400000, "sellprice": "" },
		"Сфера Астрея 1 LVL": { "price": 200000, "sellprice": "" },
		"Сфера Осириса MAX": { "price": 1800000, "sellprice": "" },
		"Сфера Осириса 2 LVL": { "price": 800000, "sellprice": "" },
		"Сфера Осириса 1 LVL": { "price": 400000, "sellprice": "" },
		"Сфера Химеры MAX": { "price": 2000000, "sellprice": "" },
		"Сфера Химеры 2 LVL": { "price": 800000, "sellprice": "" },
		"Сфера Химеры 1 LVL": { "price": 300000, "sellprice": "" },
		"Зелье отрыжки": { "price": 250000, "sellprice": 0 },
		"Зелье Киллера": { "price": 800000, "sellprice": "" },
		"Зелье Победителя": { "price": 500000, "sellprice": "" },
		"Зелье Медика": { "price": 300000, "sellprice": "" },
		"Зелье Агента": { "price": 200000, "sellprice": "" },
		"Серная кислота": { "price": 300000, "sellprice": 0 },
		"Трезубец": { "price": 110000, "sellprice": 0 },
		"Шлем Крушителя": { "price": 1300000, "sellprice": "" },
		"Нагрудник Крушителя": { "price": 1300000, "sellprice": "" },
		"Штаны Крушителя": { "price": 1300000, "sellprice": "" },
		"Ботинки Крушителя": { "price": 1300000, "sellprice": "" },
		"Арбалет Крушителя": { "price": 300000, "sellprice": "" },
		"Отмычка к сферам": { "price": 2700000, "sellprice": 2999999 },
		"Отмычка к ресурсам": { "price": 200000, "sellprice": 299999 },
		"Отмычка к броне": { "price": 200000, "sellprice": 299999 },
		"Отмычка к инструментам": { "price": 200000, "sellprice": 299999 },
		"Отмычка к оружию": { "price": 200000, "sellprice": 299999 },
		"Серебро": { "price": 5000, "sellprice": 10000 },
		"Обычный мист": { "price": 7000000, "sellprice": "" },
		"Легендарный мист": { "price": 20000000, "sellprice": "" },
		"Тотем бессмертия": { "price": 50000, "sellprice": 100000 },
		"Таер вайт": { "price": 100000, "sellprice": 0 },
		"Динамит": { "price": 10000, "sellprice": 0 },
		"Трапка": { "price": 300000, "sellprice": 0 },
		"Дезориентация": { "price": 50000, "sellprice": 0 },
		"Пузырек опыта": { "price": 1500, "sellprice": "" },
		"Голова дракона": { "price": 500000, "sellprice": "" },
		"Порох": { "price": 9000, "sellprice": 10000 },
		"Элитры": { "price": 200000, "sellprice": 400000 },
		"Элитры крушителя": { "price": 300000, "sellprice": 600000 },
		"Незеритовый слиток": { "price": 350000, "sellprice": 0 },
		"Зачарованное золотое яблоко": { "price": 70000, "sellprice": 0 },
		"Кирка Крушителя": { "price": 3000000, "sellprice": "" },
		"Древние обломки": { "price": 60000, "sellprice": 0 },
		"Книга починка": { "price": 700000, "sellprice": 0 },
		"Яйцо призыва эндермена": { "price": 8000000, "sellprice": 10000000 },
		"Меч Крушителя": { "price": 3300000, "sellprice": 0 },
		"Шалкеровый ящик": { "price": 30000, "sellprice": 0 },
		"Богатый мист": { "price": 40000000, "sellprice": "" }
	}
}
