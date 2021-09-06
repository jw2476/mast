"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const paths_1 = require("../paths");
const crafting = paths_1.readDatasheet("crafting");
const itemDefs = paths_1.readDatasheet("itemdefinitions_master_crafting").concat(paths_1.readDatasheet("itemdefinitions_master_named"));
const itemNames = paths_1.readLocalization("itemdefinitions_master");
let recipeCache = [];
const categories = {};
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function getNameFromID(id) {
    return itemNames[id + "_mastername"];
}
function callGenerateRecipe(raw, previousIDs) {
    return new Promise(res => {
        setTimeout(() => res(generateRecipe(raw, previousIDs)), 0);
    });
}
async function generateRecipe(raw, previousIDs) {
    if (raw?.recipeID === "timbert3")
        console.log(previousIDs);
    if (!raw?.recipeID)
        return;
    const itemID = raw.isProcedural ? raw["proceduralTierID" + raw.baseTier] : raw.recipeID;
    if (previousIDs.includes(itemID))
        return;
    else
        previousIDs.push(itemID);
    const existing = recipeCache.find(recipe => recipe.itemID === itemID);
    if (existing) {
        return existing;
    }
    const itemDef = itemDefs.find(itemDef => itemDef.itemID === itemID);
    if (!itemDef)
        return;
    let ingredients = [];
    for (let i = 0; i < 7; i++) {
        const rawIngredient = {
            id: raw["ingredient" + i],
            type: raw["type" + i],
            quantity: raw["qty" + i]
        };
        if (rawIngredient.type === "Item" || rawIngredient.type === "Currency") {
            let recipe = crafting.find(recipe => recipe.recipeID === rawIngredient.id);
            if (recipe) {
                ingredients.push(await callGenerateRecipe(recipe, previousIDs));
                await sleep(1);
            }
            else {
                const itemDef = itemDefs.find(itemDef => itemDef.itemID === rawIngredient.id);
                ingredients.push({
                    itemID: rawIngredient.id,
                    itemName: getNameFromID(rawIngredient.id),
                    quantity: rawIngredient.quantity,
                    gearScoreBuff: itemDef?.ingredientGearScoreBaseBonus
                });
            }
        }
        else if (rawIngredient.type === "Category_Only") {
            let categoryIngredients = [];
            let category = categories[rawIngredient.id];
            for (const itemID of category) {
                let recipe = crafting.find(recipe => recipe.recipeID === itemID);
                if (recipe) {
                    categoryIngredients.push(await callGenerateRecipe(recipe, previousIDs));
                    await sleep(1);
                }
                else {
                    const itemDef = itemDefs.find(itemDef => itemDef.itemID === itemID);
                    categoryIngredients.push({
                        itemID,
                        itemName: getNameFromID(itemID),
                        quantity: rawIngredient.quantity,
                        gearScoreBuff: itemDef?.ingredientGearScoreBaseBonus
                    });
                }
            }
            ingredients.push(categoryIngredients);
        }
    }
    const recipe = {
        itemID,
        originalID: raw.recipeID,
        itemName: getNameFromID(itemID),
        itemType: raw.craftingCategory,
        quantity: raw.outputQty,
        ingredients,
        tradeskill: raw.tradeskill,
        recipeLevel: raw.recipeLevel,
        cooldownSeconds: raw.cooldownSeconds,
        amountPerCooldown: raw.cooldownQuantity,
        bindOnPickup: itemDef.bindOnPickup,
        minGearScore: itemDef.minGearScore,
        maxGearScore: itemDef.maxGearScore,
        gearScoreBuff: itemDef.ingredientGearScoreBaseBonus
    };
    const idx = previousIDs.indexOf(recipe.itemID);
    if (idx > -1) {
        previousIDs.splice(idx, 1);
    }
    if (!existing) {
        recipeCache.push(recipe);
    }
    return recipe;
}
function generateCategories() {
    for (const itemDef of itemDefs) {
        for (const category of itemDef.ingredientCategories.split(",")) {
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(itemDef.itemID);
        }
    }
}
exports.default = async () => {
    generateCategories();
    let recipes = [];
    for (const raw of crafting) {
        let recipe = await generateRecipe(raw, []);
        if (!recipe)
            continue;
        recipes.push(recipe);
    }
    paths_1.writeFile(paths_1.OUT + "/crafting.json", JSON.stringify(recipes, null, 2));
};
//# sourceMappingURL=crafting.js.map