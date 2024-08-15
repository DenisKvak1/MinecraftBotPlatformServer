const path = require('path');

module.exports = {
	mode: 'production',
	entry: './src/index.ts',
	target: 'node',
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.node$/,
				use: 'node-loader',
			},
		],
	},
	resolve: {
		extensions: ['.ts', '.js', '.json'],
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
	}
};