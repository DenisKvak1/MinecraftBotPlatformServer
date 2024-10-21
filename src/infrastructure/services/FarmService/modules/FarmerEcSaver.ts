import {Bot} from "mineflayer";
import {Entity} from "prismarine-entity";
import {clear} from "winston";
import {syncTimeout} from "../../../../../env/helpers/syncTimeout";
import {Item} from "prismarine-item";
import {ToGeneralizedItem} from "../../../../../env/helpers/ToGeneralizedItem";
import {logger} from "../../../logger/Logger";
import {BotEc} from "./Ec";


type FarmerSaverConfig = {
    whiteList: string[],
    timeoutReturn: number
}

export class FarmerEcSaver {
    private ec: BotEc
    private farmerInInventory: boolean = true;
    private allowReturnFarmer: boolean = true
    private trackingSpawnFunction: (entity: Entity) => Promise<void>
    private trackingDeSpawnFunction: (entity?: Entity) => Promise<void>
    private config: FarmerSaverConfig
    private bot: Bot

    public constructor(bot: Bot, config: FarmerSaverConfig) {
        this.bot = bot
        this.config = config
        this.ec = new BotEc(bot)

        this.initTrackingFunction()
    }


    public async on() {
        this.initFarmerState()

        await this.trackingDeSpawnFunction()
        Object.values(this.bot.entities).forEach((entity) => this.trackingSpawnFunction(entity))

        this.bot.on('entitySpawn', this.trackingSpawnFunction.bind(this))
        this.bot.on('entityGone', this.trackingDeSpawnFunction.bind(this))
    }

    public off() {
        this.bot.off('entitySpawn', this.trackingSpawnFunction)
        this.bot.off('entityGone', this.trackingDeSpawnFunction)
    }

    private initFarmerState() {
        const farmer = this.findFarmer(this.bot.inventory.slots)
        this.farmerInInventory = Boolean(farmer)
    }


    public initTrackingFunction() {
        this.trackingSpawnFunction = async (entity: Entity) => {
            if (!this.isTargetEntity(entity)) return
            this.allowReturnFarmer = false
            setTimeout(() => {
                this.allowReturnFarmer = true
                this.trackingDeSpawnFunction()
            }, this.config.timeoutReturn)

            await this.saveFarmer()
        }

        this.trackingDeSpawnFunction = async (despawnEntity?: Entity) => {
            if (!this.allowReturnFarmer) return

            const listEntities = Object.values(this.bot.entities)
            const entities = despawnEntity ? listEntities.filter((entity) => entity !== despawnEntity) : listEntities
            const includeTargetPlayer = entities.some((entity) => this.isTargetEntity(entity))
            if (includeTargetPlayer) return

            await this.returnFarmer()
        }
    }

    private async saveFarmer() {
        if (!this.farmerInInventory) return
        await this.ec.openEc()

        const fakeSword = this.findFakeSword(this.ec.getEcSlots())
        const farmer = this.findFarmer(this.ec.getInventorySlots())
        await this.swapSlot(farmer.slot, fakeSword.slot)
        this.bot.closeWindow(this.bot.currentWindow)

        logger.info('Сложил Фармер в ЕК')

        this.farmerInInventory = false
    }

    private async returnFarmer() {
        if (this.farmerInInventory) return
        await this.ec.openEc()

        const fakeSword = this.findFakeSword(this.ec.getInventorySlots())
        const farmer = this.findFarmer(this.ec.getEcSlots())

        await this.swapSlot(farmer.slot, fakeSword.slot)
        this.bot.closeWindow(this.bot.currentWindow)

        logger.info('Взял фармер из EC')

        this.farmerInInventory = true
    }


    private async swapSlot(slot1: number, slot2: number) {
        await this.bot.clickWindow(Math.max(slot1, slot2), 0, 0)
        await this.bot.clickWindow(Math.min(slot1, slot2), 0, 0)
        await this.bot.clickWindow(Math.max(slot1, slot2), 0, 0)
    }

    private isTargetEntity(entity: Entity): boolean {
        if (entity.type !== 'player') return false
        if (entity.username === this.bot.username) return false
        if (this.config.whiteList.includes(entity.username)) return false

        return true
    }

    private findFakeSword(ecSlots: (Item | null)[]): Item {
        const targetItemName = '- Меч ᴇᴛᴇʀɴɪᴛʏ -'
        const fakeSword = ecSlots.find((item) => {
            return ToGeneralizedItem(item)?.customName === targetItemName || item?.displayName === targetItemName
        })

        return fakeSword
    }

    private findFarmer(inventorySlots: (Item | null)[]) {
        const farmer = inventorySlots.find((item) => this.isFarmer(item))

        return farmer
    }

    private isFarmer(item: Item): boolean {
        const lore = ToGeneralizedItem(item)?.customLoreHTML
        // return lore?.includes('Богач')
        return lore?.includes('Фармер')
    }
}