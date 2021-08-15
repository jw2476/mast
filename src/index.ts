import {readFileSync, writeFileSync, existsSync} from "fs";
import * as fxp from "fast-xml-parser"
import Dict = NodeJS.Dict;

const DATA_DIR = __dirname + "/../data/"

function craftingNames() {
    const raw = readFileSync(DATA_DIR + "javelindata_craftingnames.loc.xml", {encoding: "utf-8"})
    const data = fxp.parse(raw, {
        ignoreAttributes: false,
        attributeNamePrefix: "",
        textNodeName: "value"
    }).resources.string
    let out: Dict<string> = {}

    for (const {key, value} of data) {
        out[key.split("_CraftName")[0]] = value.split("\\n").join(" ")
    }

    writeFileSync(DATA_DIR + "javelindata_craftingnames.json", JSON.stringify(out, null, "\t"), {
        flag: existsSync(DATA_DIR + "javelindata_craftingnames.json") ? "w" : "wx"
    })
}

console.log("javelindata_craftingnames.loc.xml -> javelindata_craftingnames.json")
craftingNames()