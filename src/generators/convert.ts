import {existsSync, readFileSync} from "fs";
import {DATA, DATASHEETS, LOCALIZATIONS, TMP, writeFile} from "../paths";
import * as inquirer from "inquirer";
import * as glob from "glob";
import * as fxp from "fast-xml-parser"
import Dict = NodeJS.Dict;

type Column = {
    type: number
    name: string
}

const lowercasify: Dict<string[]> = {
    "javelindata_crafting": ["craftingCategory", "ingredient1", "ingredient2", "ingredient3", "ingredient4", "ingredient5", "ingredient6", "ingredient7", "proceduralTierID1", "proceduralTierID2", "proceduralTierID3", "proceduralTierID4", "proceduralTierID5"],
    "javelindata_itemdefinitions_master_crafting": ["ingredientCategories", "name"]
}

async function convertDatasheet(fileName: string) {
    function readString(start: number): string {
        let i = 0
        let offset = 0x3c + headerSize + start

        while (bytes[offset + i] !== 0) {
            i++
        }

        let rawString = Buffer.alloc(i)
        bytes.copy(rawString, 0, offset, offset + i)
        return rawString.toString('utf-8')
    }

    let bytes: Buffer = readFileSync(`${DATA}/${fileName}.datasheet`)
    let headerSize = bytes.readInt32LE(0x38)
    let numColumns = bytes.readInt32LE(0x44)
    let numRows = bytes.readInt32LE(0x48)

    let columns: Column[] = []
    for (let numColumn = 0; numColumn < numColumns; numColumn++) {
        let offset = 0x5c + numColumn * 12
        let nameOffset = bytes.readInt32LE(offset + 4)
        let name = readString(nameOffset)
        let type = bytes.readInt32LE(offset + 8)
        columns.push({
            type,
            name
        })
    }

    let rowSize = numColumns * 8
    let table = []

    for (let numRow = 0; numRow < numRows; numRow++) {
        let row = {}
        for (let numColumn = 0; numColumn < numColumns; numColumn++) {
            let offset = bytes.readInt32LE(0x5c + numColumns * 12 + numRow * rowSize + numColumn * 8)
            const stringValue = readString(offset)
            if (![1,2,3].includes(columns[numColumn].type)) console.log(columns[numColumn].type)

            if (columns[numColumn].type === 1) {
                row[columns[numColumn].name] = stringValue
            } else if (columns[numColumn].type === 2) {
                row[columns[numColumn].name] = parseFloat(stringValue)
            } else if (columns[numColumn].type === 3) {
                row[columns[numColumn].name] = stringValue === "1"
            }


        }
        table.push(row)
    }

    for (let row of table) {
        try {
            for (let key of Object.keys(row)) {
                if (key[1].toLowerCase() === key[1]) { // Checks for acronyms
                    let value = row[key]
                    delete row[key]
                    key = key[0].toLowerCase() + key.slice(1)
                    row[key] = value
                }
            }
        } catch {}
    }



    for (let row of table) {
        for (let key of Object.keys(row)) {
            if (key.endsWith("ID")) {
                try {
                    row[key] = row[key].toLowerCase()
                } catch {}
            }
            if (lowercasify[fileName]?.includes(key)) {
                row[key] = row[key].toLowerCase()
            }

        }
    }

    writeFile(`${DATASHEETS}/${fileName}.json`, JSON.stringify(table, null, 2))

    for (let row of table) {
        for (let key of Object.keys(row)) {
            if (row[key] == "") {
                delete row[key]
            }
        }
    }

    writeFile(`${DATASHEETS}/${fileName}.min.json`, JSON.stringify(table, null, 2))
}

async function convertLocalization(fileName: string) {
    let xml = readFileSync(DATA + `/${fileName}.loc.xml`, {encoding: "utf-8"})
    let rawData = fxp.parse(xml, {
        attributeNamePrefix: "",
        ignoreAttributes: false,
        textNodeName: "value"
    })

    let data = {}
    for (const row of rawData["resources"]["string"]) {
        data[row.key.toLowerCase()] = row.value
    }

    writeFile(`${LOCALIZATIONS}/${fileName}.json`, JSON.stringify(data, null, 2))
}

export async function convert() {
    if (existsSync(TMP)) {
        const {decryptAgain} = await inquirer.prompt({
            type: 'confirm',
            name: 'decryptAgain',
            message: 'The output directory has already been made, there is probably already decrypted data there, do you want to decrypt again?',
            default: false
        })
        if (!decryptAgain) return
    }

    let datasheets = glob.sync("*.datasheet", {cwd: DATA})
    let localizations = glob.sync("*.loc.xml", {cwd: DATA})

    for (const file of datasheets) {
        let name = file.split(".")[0]
        console.log(`${name}.datasheet -> ${name}.json`)
        await convertDatasheet(name)
    }

    for (const file of localizations) {
        let name = file.split(".")[0]
        console.log(`${name}.loc.xml -> ${name}.json`)
        await convertLocalization(name)
    }
}