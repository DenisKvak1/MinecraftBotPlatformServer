import {Bot} from "mineflayer";
import {Item} from "prismarine-item";
import {BotEc} from "./Ec";


type ExpSaverConfig = {
    level: number,
    bottleIndex: number,
    bottlePrice: number
}

export class ExpEcSaver {
    private config: ExpSaverConfig
    private ec: BotEc
    private trackingExpFunction: () => Promise<void>
    private bot: Bot

    public constructor(bot: Bot, config: ExpSaverConfig) {
        this.bot = bot
        this.config = config
        this.ec = new BotEc(bot)

        this.initTrackingFunction()
    }

    public async on() {
        await this.trackingExpFunction()
        this.bot.on('experience', this.trackingExpFunction.bind(this))
    }

    public off() {
        this.bot.off('experience', this.trackingExpFunction)
    }

    private initTrackingFunction() {
        this.trackingExpFunction = async () => {
            const expLevel = this.bot.experience.level
            if (expLevel >= this.config.level) await this.saveExp()
        }
    }

    private async saveExp() {
        const oldHotBarSlot = this.bot.quickBarSlot
        if ((this.bot.experience.points / this.config.bottlePrice) > this.calculateGlassBottle()) {
            throw new Error('Не хватает пузырьков')
        }
        await this.openExpSaver()

        await this.bot.clickWindow(this.config.bottleIndex, 0, 1)
        this.bot.closeWindow(this.bot.currentWindow)

        await this.ec.openEc()
        const indexes = this.findBottleExpIndexes(this.ec.getInventorySlots())
        await this.saveAllExpBottle(indexes)

        this.bot.closeWindow(this.bot.currentWindow)
        this.bot.setQuickBarSlot(oldHotBarSlot)
    }

    private async saveAllExpBottle(indexes: number[]) {
        for (const index of indexes) {
            await this.saveOneBottle(index)
        }
    }

    private saveOneBottle(index: number) {
        return this.bot.clickWindow(index, 0, 1)
    }

    private findBottleExpIndexes(slots: (Item | null)[]) {
        const indexes: number[] = []
        slots.forEach((item) => {
            if (item?.name === 'experience_bottle') indexes.push(item.slot)
        })

        return indexes
    }


    private calculateGlassBottle() {
        const count = this.bot.inventory.slots.reduce((acc, item) => {
            if (!item) return acc
            if (item?.name !== 'glass_bottle') return acc

            return acc + item.count
        }, 0)
        return count
    }

    private async openExpSaver() {
        const promise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.bot.off('windowOpen', onOpen)
                reject(new Error('Обмениик опыта не открылся'))
            }, 3000)
            const onOpen = async () => {
                this.bot.off('windowOpen', onOpen)
                clearTimeout(timeout)
                resolve()
            }
            if (this.bot.currentWindow) onOpen()
            this.bot.once('windowOpen', onOpen)
        })
        this.bot.chat('/exp')

        return promise
    }

}