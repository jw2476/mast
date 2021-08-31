"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crafting = void 0;
const paths_1 = require("../paths");
function crafting() {
    const crafting = paths_1.readDatasheet("crafting");
    const itemDefs = paths_1.readDatasheet("itemdefinitions_master_crafting").concat(paths_1.readDatasheet("itemdefinitions_master_named"));
    const itemNames = paths_1.readLocalization("itemdefinitions_master");
    const categoryNames = paths_1.readLocalization("craftingcategories");
    let recipes = [];
    let itemTypes = [];
    for (const recipe of crafting) {
        if (recipe.recipeID.startsWith("procedural")) {
            recipe.recipeID = recipe["proceduralTierID" + recipe.recipeID[recipe.recipeID.length - 1]];
        }
        let itemDef = itemDefs.find(itemDef => itemDef.itemID.toLowerCase() === recipe.recipeID);
        if (!itemDef) {
            continue;
        }
        let ingredients = [];
        for (let i = 1; i < 8; i++) {
            if (!recipe[`ingredient${i}`])
                break;
            const type = recipe[`type${i}`];
            const ingredientID = recipe[`ingredient${i}`];
            let ingredientName;
            if (type === "Item") {
                ingredientName = itemNames[ingredientID + "_mastername"];
            }
            else if (type === "Category_Only") {
                ingredientName = categoryNames[ingredientID + "_groupname"];
            }
            let ingredient = {
                ingredientID,
                type,
                quantity: recipe[`qty${i}`],
                ingredientName
            };
            ingredients.push(ingredient);
        }
        let entry = {
            itemID: recipe.recipeID,
            itemName: itemNames[recipe.recipeID + "_mastername"],
            itemType: recipe.craftingCategory,
            outputQuantity: recipe.outputQty,
            ingredients,
            tradeskill: recipe.tradeskill,
            recipeLevel: recipe.recipeLevel,
            cooldownSeconds: recipe.cooldownSeconds,
            amountPerCooldown: recipe.cooldownQuantity,
            bindOnPickup: itemDef.bindOnPickup,
            bindOnEquip: itemDef.bindOnEquip,
            minGearScore: itemDef.minGearScore,
            maxGearScore: itemDef.maxGearScore,
            minGearScoreBuff: itemDef.ingredientGearScoreBaseBonus,
            maxGearScoreBuff: itemDef.ingredientGearScoreMaxBonus
        };
        if (!itemTypes.includes(entry.itemType))
            itemTypes.push(entry.itemType);
        recipes.push(entry);
    }
    console.log(itemTypes);
    let categories = {};
    for (const itemDef of itemDefs) {
        if (!itemDef.ingredientCategories)
            continue;
        for (const category of itemDef.ingredientCategories.split(",")) {
            if (!categories[category]) {
                categories[category] = {};
            }
            categories[category][itemDef.itemID] = itemNames[itemDef.name.slice(1)]; // Remove @
        }
    }
    let output = {
        recipes,
        categories
    };
    paths_1.writeFile(`${paths_1.OUT}/crafting.json`, JSON.stringify(output, null, 2));
}
exports.crafting = crafting;
//# sourceMappingURL=crafting.js.map