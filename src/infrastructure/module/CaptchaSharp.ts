import sharp from 'sharp';
import path from 'path';

type captchDetail = {
	path: string,
	direction: number
}

export class CaptchaSharp {
	constructor(
		private options: {
			rows: number,
			cols: number,
			pathFile: string,
			pathMap: string,
			captchaMap: { direction: number, id: number }[]
		},
	) {
	}

	execute() {
		const mapForSharrp = this.options.captchaMap.map((captcha) => {
			return {
				path: path.join(this.options.pathMap, `./map_${captcha.id.toString().padStart(6, '0')}.png`),
				direction: captcha.direction,
			};
		});

		return this.joinImages(mapForSharrp, this.options.rows, this.options.cols, this.options.pathFile);
	}

	private async joinImages(captchDetails: captchDetail[], rows: number, columns: number, pathFile: string) {
		const images = await Promise.all(captchDetails.map(captchDetail => {
			return this.rotateImage(captchDetail.path, captchDetail.direction * 90);
		}));

		const firstImage = sharp(images[0]);
		const metadata = await firstImage.metadata();
		const canvasWidth = (metadata.width || 0) * columns;
		const canvasHeight = (metadata.height || 0) * rows;

		const canvas = sharp({
			create: {
				width: canvasWidth,
				height: canvasHeight,
				channels: 3,
				background: { r: 255, g: 255, b: 255 },
			},
		});

		const compositeOperations: sharp.OverlayOptions[] = [];

		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < columns; j++) {
				const index = i * columns + j;
				if (index < images.length) {
					const left = j * (metadata.width || 0);
					const top = i * (metadata.height || 0);
					compositeOperations.push({ input: images[index], top, left });
				}
			}
		}
		await canvas.composite(compositeOperations).toFile(pathFile);

		return canvas.composite(compositeOperations).toBuffer();
	}

	private async rotateImage(imagePath: string, angle: number): Promise<Buffer> {
		const image = sharp(imagePath);
		const rotatedImage = await image.rotate(angle).toBuffer();
		return rotatedImage;
	}
}

