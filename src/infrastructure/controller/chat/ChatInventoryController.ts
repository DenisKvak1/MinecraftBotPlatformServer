import { IInventoryService } from '../../../core/service/InventoryService';
import { inventoryService } from '../../services/InventoryService';
import { IWindowService } from '../../../core/service/WindowService';
import { windowsService } from '../../services/WindowService';

export class ChatInventoryController {
	constructor(
		private windowService: IWindowService,
		private inventoryService: IInventoryService,
	) {}

	async dropAllSlots(botID: string) {
		try {
			this.windowService.closeWindow(botID)
			this.inventoryService.dropAll(botID)
		} catch (e){

		}
	}
}
export const chatInventoryController = new ChatInventoryController(windowsService,inventoryService)