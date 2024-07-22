import fs from 'fs';

export interface IJSONController {
    saveJSON(data: any): void;
    loadJSON(): any;
}

export class JSONController {

    constructor(private filePath: string) {}

    saveJSON(data: any): void {
        try {
            const json = JSON.stringify(data, null, 2);
            fs.writeFileSync(this.filePath, json, 'utf8');
            console.log('Data successfully saved to file.');
        } catch (error) {
            console.error('An error occurred while saving JSON:', error);
        }
    }

    loadJSON(): any {
        try {
            if (fs.existsSync(this.filePath)) {
                const json = fs.readFileSync(this.filePath, 'utf8');
                return JSON.parse(json);
            } else {
                console.error('File does not exist.');
                return null;
            }
        } catch (error) {
            console.error('An error occurred while loading JSON:', error);
            return null;
        }
    }
}
export const JSONControllerImpl = new JSONController(`${process.cwd()}/database/Accounts.json`)