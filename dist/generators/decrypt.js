"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = void 0;
const fs_1 = require("fs");
const paths_1 = require("../paths");
const inquirer = require("inquirer");
const glob = require("glob");
async function decryptFile(fileName) {
    function readString(start) {
        let i = 0;
        let offset = 0x3c + headerSize + start;
        while (bytes[offset + i] !== 0) {
            i++;
        }
        let rawString = Buffer.alloc(i);
        bytes.copy(rawString, 0, offset, offset + i);
        return rawString.toString('utf-8');
    }
    let bytes = fs_1.readFileSync(`${paths_1.DATA}/${fileName}.datasheet`);
    let headerSize = bytes.readInt32LE(0x38);
    let numColumns = bytes.readInt32LE(0x44);
    let numRows = bytes.readInt32LE(0x48);
    let columns = [];
    for (let numColumn = 0; numColumn < numColumns; numColumn++) {
        let offset = 0x5c + numColumn * 12;
        let nameOffset = bytes.readInt32LE(offset + 4);
        let name = readString(nameOffset);
        let type = bytes.readInt32LE(offset + 8);
        columns.push({
            type,
            name
        });
    }
    let rowSize = numColumns * 8;
    let table = [];
    for (let numRow = 0; numRow < numRows; numRow++) {
        let row = {};
        for (let numColumn = 0; numColumn < numColumns; numColumn++) {
            let offset = bytes.readInt32LE(0x5c + numColumns * 12 + numRow * rowSize + numColumn * 8);
            row[columns[numColumn].name] = readString(offset);
        }
        table.push(row);
    }
    for (let row of table) {
        try {
            for (let key of Object.keys(row)) {
                if (key[1].toLowerCase() === key[1]) { // Checks for acronyms
                    let value = row[key];
                    delete row[key];
                    key = key[0].toLowerCase() + key.slice(1);
                    row[key] = value;
                }
            }
        }
        catch { }
    }
    paths_1.writeFile(`${paths_1.TMP}/${fileName}.json`, JSON.stringify(table, null, 2));
    for (let row of table) {
        for (let key of Object.keys(row)) {
            if (row[key] == "") {
                delete row[key];
            }
        }
    }
    paths_1.writeFile(`${paths_1.TMP}/${fileName}.min.json`, JSON.stringify(table, null, 2));
}
async function decrypt() {
    if (fs_1.existsSync(paths_1.TMP)) {
        const { decryptAgain } = await inquirer.prompt({
            type: 'confirm',
            name: 'decryptAgain',
            message: 'The output directory has already been made, there is probably already decrypted data there, do you want to decrypt again?',
            default: false
        });
        if (!decryptAgain)
            return;
    }
    let files = glob.sync("*.datasheet", { cwd: paths_1.DATA });
    for (const file of files) {
        let name = file.split(".")[0];
        console.log(`${name}.datasheet -> ${name}.json`);
        await decryptFile(name);
    }
}
exports.decrypt = decrypt;
//# sourceMappingURL=decrypt.js.map