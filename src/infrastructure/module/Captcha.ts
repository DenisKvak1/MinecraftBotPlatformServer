import { Bot } from 'mineflayer';
import { CaptchaPreset } from '../../core/service/CaptchaService';
import path from 'node:path';
import { CaptchaSharp } from './CaptchaSharp';


type mapID = number
type iframeID = number
type CaptchaMap = { direction: number, id: number }


type pos = {
	x: number,
	y: number,
	z: number
}

export class Captcha {
	private iframeMap = new Map<iframeID, { mapID: number, mapDirection: number }>()
	private iframePos = new Map<iframeID, pos>()
	private mapPos = new Map<mapID, { direction: number, pos: pos }>()
	private orderMap: CaptchaMap[] = []

	constructor(
		private bot: Bot,
		private options: CaptchaPreset
	) { }


	async execute() {
		const IFrameMapPromise = this.loadIframeMap()
		const IframePosPromise = this.loadIframePos()

		await Promise.all([IFrameMapPromise, IframePosPromise])
		this.formatMapPos()
		this.formatToOrder()

		const bufferResultImage = new CaptchaSharp({
			pathFile: this.options.resultPath,
			pathMap: this.options.mapsPath,
			captchaMap: this.orderMap,
			rows: this.options.rows,
			cols: this.options.cols
		}).execute();

		return bufferResultImage
	}

	private formatToOrder() {
		this.orderMap = this.convertCoordinatesToOrder(
			this.mapPos,
			this.options.rows,
			this.options.cols,
			this.options.startX,
			this.options.startY,
			this.options.invertRows,
			this.options.invertCol
		);
	}

	private formatMapPos() {
		this.iframeMap.forEach((mapKey, frameKey) => {
			const pos = this.iframePos.get(frameKey) as pos
			this.mapPos.set(mapKey.mapID, { direction: mapKey.mapDirection, pos })
		});
	}

	private loadIframeMap(): Promise<void> {
		return new Promise((resolve, reject) => {
			let packetReceived = false;

			const onPacket = (packet: any, meta: any) => {
				if (meta.name !== "entity_metadata") return;


				const frame = packet.entityId;
				const mapID =
					packet.metadata.find((item: any) => item.key === 7)?.value?.nbtData?.value?.map?.value
					||
					packet.metadata.find((item: any) => item.key === 8)?.value?.nbtData?.value?.map?.value;
				const mapDirection = packet.metadata.find((item: any) => item.key === 8)?.value | 0;

				this.iframeMap.set(frame, { mapID, mapDirection });

				if (!packetReceived) {
					packetReceived = true;
					setTimeout(() => {
						this.bot._client.off('packet', onPacket);
						resolve();
					}, 300);
				}
			};

			setTimeout(()=> {
				this.bot._client.off('packet', onPacket);
			}, 5 * 1000)
			this.bot._client.on('packet', onPacket);
		});
	}

	private loadIframePos(): Promise<void> {
		return new Promise((resolve, reject) => {
			let packetReceived = false;

			const onPacket = (packet: any, meta: any) => {
				if (meta.name !== "spawn_entity") return;

				if (!packetReceived) {
					packetReceived = true;
					setTimeout(() => {
						this.bot._client.off('packet', onPacket);
						resolve();
					}, 150);
				}

				this.iframePos.set(packet.entityId, { x: packet.x, y: packet.y, z: packet.z });
			};

			setTimeout(()=> {
				this.bot._client.off('packet', onPacket);
			}, 5 * 1000)
			this.bot._client.on('packet', onPacket);
		});
	}

	private convertCoordinatesToOrder(
		framesMap: Map<number, { direction: number, pos: pos }>,
		rows: number,
		cols: number,
		startX: number,
		startY: number,
		invertRows: boolean = false,
		invertCols: boolean = false
	) {
		const orderMap: { direction: number, id: number }[] = [];

		const getOrder = (x: number, y: number): number => {
			const col = x - startX;
			const row = startY - y;

			const finalCol = invertCols ? col : cols - 1 - col;
			const finalRow = invertRows ? rows - 1 - row : row;

			return (finalRow * cols) + finalCol;
		};

		framesMap.forEach((pos, id) => {
			const order = getOrder(pos.pos.x, pos.pos.y);

			orderMap[order] = { id, direction: pos.direction };
		});

		return orderMap;
	}
}
