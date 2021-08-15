"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const fxp = require("fast-xml-parser");
const crafting = require("./data/javelindata_crafting.json");
const DATA_DIR = __dirname + "/../data/";
function craftingNames() {
    const raw = fs_1.readFileSync(DATA_DIR + "javelindata_craftingnames.loc.xml", { encoding: "utf-8" });
    const data = fxp.parse(raw, {
        ignoreAttributes: false,
        attributeNamePrefix: "",
        textNodeName: "value"
    }).resources.string;
    let out = {};
    const valid_keys = crafting.map(recipe => recipe.RecipeID);
    console.log(valid_keys);
    for (let { key, value } of data) {
        key = key.split("_CraftName")[0];
        if (valid_keys.includes(key)) {
            out[key] = value.split("\\n").join(" ");
            console.log(key);
        }
    }
    fs_1.writeFileSync(DATA_DIR + "javelindata_craftingnames.json", JSON.stringify(out, null, "\t"), {
        flag: fs_1.existsSync(DATA_DIR + "javelindata_craftingnames.json") ? "w" : "wx"
    });
}
console.log("javelindata_craftingnames.loc.xml -> javelindata_craftingnames.json");
craftingNames();
//# sourceMappingURL=index.js.map