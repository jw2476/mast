import {OUT, readDatasheet, readLocalization, writeFile} from "../paths";
import {CraftingDatasheet, IngredientType} from "../types/crafting";
import {ItemdefsMasterCraftingDatasheet} from "../types/itemdefinitions_master_crafting";

export type Ingredient = {
    ingredientID: string
    ingredientName: string
    type: IngredientType
    quantity: number
}

export type CraftingEntry = {
    itemID: string
    itemName: string
    itemType: string
    outputQuantity: number
    ingredients: Ingredient[]
    tradeskill: string
    recipeLevel: number
    cooldownSeconds: number
    amountPerCooldown: number
    bindOnPickup: boolean
    bindOnEquip: boolean
    minGearScore: number
    maxGearScore: number
    minGearScoreBuff: number
    maxGearScoreBuff: number
}

export function crafting() {
    const crafting: CraftingDatasheet = readDatasheet("crafting")
    const itemDefs: ItemdefsMasterCraftingDatasheet = readDatasheet("itemdefinitions_master_crafting").concat(readDatasheet("itemdefinitions_master_named"))
    const itemNames = readLocalization("itemdefinitions_master")
    const categoryNames = readLocalization("craftingcategories")

    let recipes: CraftingEntry[] = []
    let itemTypes = []
    for (const recipe of crafting) {
        if (recipe.recipeID.startsWith("procedural")) {
            recipe.recipeID = recipe["proceduralTierID" + recipe.recipeID[recipe.recipeID.length - 1]]
        }

        let itemDef = itemDefs.find(itemDef => itemDef.itemID.toLowerCase() === recipe.recipeID)
        if (!itemDef) {
            continue
        }

        let ingredients: Ingredient[] = []
        for (let i = 1; i < 8; i++) {
            if (!recipe[`ingredient${i}`]) break

            const type = recipe[`type${i}`]
            const ingredientID = recipe[`ingredient${i}`]

            let ingredientName
            if (type === "Item") {
                ingredientName = itemNames[ingredientID + "_mastername"]
            } else if (type === "Category_Only") {
                ingredientName = categoryNames[ingredientID + "_groupname"]
            }

            let ingredient: Ingredient = {
                ingredientID,
                type,
                quantity: recipe[`qty${i}`],
                ingredientName
            }
            ingredients.push(ingredient)
        }

        let entry: CraftingEntry = {
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
        }

        if (!itemTypes.includes(entry.itemType)) itemTypes.push(entry.itemType)

        recipes.push(entry)
    }

    console.log(itemTypes)

    let categories: Record<string, Record<string, string>> = {}
    for (const itemDef of itemDefs) {
        if (!itemDef.ingredientCategories) continue
        for (const category of itemDef.ingredientCategories.split(",")) {
            if (!categories[category]) {
                categories[category] = {}
            }
            categories[category][itemDef.itemID] = itemNames[itemDef.name.slice(1)] // Remove @
        }
    }

    let output = {
        recipes,
        categories
    }
    writeFile(`${OUT}/crafting.json`, JSON.stringify(output, null, 2))
}