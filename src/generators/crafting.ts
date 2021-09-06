import {OUT, readDatasheet, readLocalization, writeFile} from "../paths";
import {CraftingDatasheet, IngredientType, RawRecipe} from "../types/crafting";
import {ItemdefsMasterCraftingDatasheet} from "../types/itemdefinitions_master_crafting";

const crafting: CraftingDatasheet = readDatasheet("crafting")
const itemDefs: ItemdefsMasterCraftingDatasheet = readDatasheet("itemdefinitions_master_crafting").concat(readDatasheet("itemdefinitions_master_named"))
const itemNames = readLocalization("itemdefinitions_master")
const categoryNames = readLocalization("craftingcategories")
let recipeCache: Recipe[] = []

const categories: Record<string, string[]> = {}

type RawIngredient = {
    id: string
    type: IngredientType
    quantity: number
}

type Item = {
    itemID: string
    itemName: string
    quantity: number
    gearScoreBuff?: number
    nwdbURL: string
}

type Category = {
    recipes: Array<Recipe | Item>
    name: string
    id: string
}

type Recipe = {
    itemID: string
    originalID: string
    itemName: string
    itemType: string
    quantity: number
    ingredients: Array<Recipe | Item | Category>
    tradeskill: string
    recipeLevel: number
    cooldownSeconds?: number
    amountPerCooldown?: number
    bindOnPickup: boolean
    minGearScore?: number
    maxGearScore?: number
    gearScoreBuff?: number
    nwdbURL: string
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getNameFromID(id: string): string {
    return itemNames[id + "_mastername"]
}

function callGenerateRecipe(raw: RawRecipe, previousIDs: string[]): Promise<Recipe | void> {
    return new Promise<Recipe | void>(res => {
        setTimeout(() => res(generateRecipe(raw, previousIDs)), 0)
    })
}

async function generateRecipe(raw: RawRecipe, previousIDs: string[]): Promise<Recipe | void> {
    if (!raw?.recipeID) return
    const itemID = raw.isProcedural ? raw["proceduralTierID" + raw.baseTier] : raw.recipeID
    if (previousIDs.includes(itemID)) return
    else previousIDs.push(itemID)

    const existing = recipeCache.find(recipe => recipe.itemID === itemID)
    if (existing) {
        return existing
    }

    const itemDef = itemDefs.find(itemDef => itemDef.itemID === itemID)
    if (!itemDef) return

    let ingredients: Array<Recipe | Item | Category> = []
    for (let i = 0; i < 7; i++) {
        const rawIngredient: RawIngredient = {
            id: raw["ingredient" + i],
            type: raw["type" + i],
            quantity: raw["qty" + i]
        }

        if (rawIngredient.type === "Item" || rawIngredient.type === "Currency") {
            let recipe = crafting.find(recipe => recipe.recipeID === rawIngredient.id)
            if (recipe) {
                ingredients.push(await callGenerateRecipe(recipe, previousIDs) as Recipe)
                await sleep(1)
            } else {
                const itemDef = itemDefs.find(itemDef => itemDef.itemID === rawIngredient.id)

                ingredients.push({
                    itemID: rawIngredient.id,
                    itemName: getNameFromID(rawIngredient.id),
                    quantity: rawIngredient.quantity,
                    gearScoreBuff: itemDef?.ingredientGearScoreBaseBonus,
                    nwdbURL: `https://nwdb.info/db/item/${rawIngredient.id}`
                })
            }
        } else if (rawIngredient.type === "Category_Only") {
            let categoryIngredients = []
            let categoryItems = categories[rawIngredient.id]
            for (const itemID of categoryItems) {
                let recipe = crafting.find(recipe => recipe.recipeID === itemID)
                if (recipe) {
                    categoryIngredients.push(await callGenerateRecipe(recipe, previousIDs) as Recipe)
                    await sleep(1)
                } else {
                    const itemDef = itemDefs.find(itemDef => itemDef.itemID === itemID)

                    categoryIngredients.push({
                        itemID,
                        itemName: getNameFromID(itemID),
                        quantity: rawIngredient.quantity,
                        gearScoreBuff: itemDef?.ingredientGearScoreBaseBonus,
                        nwdbURL: `https://nwdb.info/db/item/${itemID}`
                    })
                }
            }

            const category: Category = {
                recipes: categoryIngredients,
                name: categoryNames[rawIngredient.id + "_groupname"],
                id: rawIngredient.id
            }

            ingredients.push(category)
        }
    }


    const recipe: Recipe = {
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
        gearScoreBuff: itemDef.ingredientGearScoreBaseBonus,
        nwdbURL: `https://nwdb.info/db/recipe/${raw.recipeID}`
    }

    const idx = previousIDs.indexOf(recipe.itemID)
    if (idx > -1) {
        previousIDs.splice(idx, 1);
    }

    if (!existing) {
        recipeCache.push(recipe)
    }

    return recipe
}

function generateCategories() {
    for (const itemDef of itemDefs) {
        for (const category of itemDef.ingredientCategories.split(",")) {
            if (!categories[category]) {
                categories[category] = []
            }
            categories[category].push(itemDef.itemID)
        }
    }
}

export default async () => {
    generateCategories()

    let recipes: Recipe[] = []

    for (const raw of crafting) {
        let recipe = await generateRecipe(raw, [])
        if (!recipe) continue
        recipes.push(recipe)
    }

    writeFile(OUT + "/crafting.json", JSON.stringify(recipes, null, 2))
}