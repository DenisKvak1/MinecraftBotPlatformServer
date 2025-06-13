export const runAsync = (fn: Function) => {
	return new Promise((resolve, reject) => {
		try {
			resolve(fn());
		} catch (err) {
			reject(err);
		}
	});
};