"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crafting_1 = require("./generators/crafting");
const convert_1 = require("./generators/convert");
convert_1.convert().then(() => {
    console.log("Generating Crafting Info...");
    crafting_1.crafting();
});
//# sourceMappingURL=index.js.map