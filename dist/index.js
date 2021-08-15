"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const fxp = require("fast-xml-parser");
const DATA_DIR = __dirname + "/../data/";
function craftingNames() {
    const raw = fs_1.readFileSync(DATA_DIR + "javelindata_craftingnames.loc.xml", { encoding: "utf-8" });
    const data = fxp.parse(raw, {
        ignoreAttributes: false,
        attributeNamePrefix: "",
        textNodeName: "value"
    }).resources.string;
    let out = {};
    for (const { key, value } of data) {
        out[key.split("_CraftName")[0]] = value.split("\\n").join(" ");
    }
    fs_1.writeFileSync(DATA_DIR + "javelindata_craftingnames.json", JSON.stringify(out, null, "\t"), {
        flag: fs_1.existsSync(DATA_DIR + "javelindata_craftingnames.json") ? "w" : "wx"
    });
}
console.log("javelindata_craftingnames.loc.xml -> javelindata_craftingnames.json");
craftingNames();
//# sourceMappingURL=index.js.map