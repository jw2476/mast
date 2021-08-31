import {existsSync, mkdirSync, readFileSync, writeFileSync} from "fs";
import * as fxp from 'fast-xml-parser'

export const ROOT = __dirname + "/.."
export const DATA = ROOT + "/data"
export const TMP = ROOT + "/tmp"
export const DATASHEETS = TMP + "/datasheets"
export const LOCALIZATIONS = TMP + "/localizations"
export const OUT = ROOT + "/out"

export function writeFile(path: string, data) {
    let dir = path.substring(0, path.lastIndexOf("/"))

    if (!existsSync(dir)) {
        mkdirSync(dir, {recursive: true})
    }
    writeFileSync(path, data)
}

export function readDatasheet(name: string): any {
    return JSON.parse(readFileSync(DATASHEETS + `/javelindata_${name}.json`, {encoding: "utf-8"}))
}

export function readLocalization(name: string): any {
    return JSON.parse(readFileSync(LOCALIZATIONS + `/javelindata_${name}.json`, {encoding: "utf-8"}))
}
