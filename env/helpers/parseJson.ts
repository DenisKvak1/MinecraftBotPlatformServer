import fs from 'fs';

export function parseJsonFile(filePath: string) {
	try {
		const data = fs.readFileSync(filePath, 'utf8');
		const jsonData = JSON.parse(data);
		return jsonData;
	} catch (err) {
		console.error('Ошибка:', err);
		throw err;
	}
}
