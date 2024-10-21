import {Bot} from "mineflayer";

export class BotEc {
    constructor(
        private bot: Bot
    ) {
    }

    public async openEc() {
        const promise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.bot.off('windowOpen', onOpen)
                reject(new Error('Эндер сундук не открылся'))
            }, 3000)
            const onOpen = async () => {
                this.bot.off('windowOpen', onOpen)
                clearTimeout(timeout)
                resolve()
            }
            if (this.bot.currentWindow) onOpen()
            this.bot.once('windowOpen', onOpen)
        })
        this.bot.chat('/ec')

        return promise
    }

    public getEcSlots() {
        return this.bot.currentWindow.slots.slice(0, 53)
    }

    public getInventorySlots() {
        return this.bot.currentWindow.slots.slice(54, 89)
    }
}