export type IngredientType = undefined | "Category_Only" | "Item" | "Currency"

export type RawRecipe = {
    recipeID: string
    craftingCategory: string
    tradeskill: string
    recipeLevel: number
    outputQty: number
    isProcedural: boolean
    baseTier: number

    ingredient1: string
    type1: IngredientType
    qty1: number

    ingredient2: string
    type2: IngredientType
    qty2: number

    ingredient3: string
    type3: IngredientType
    qty3: number

    ingredient4: string
    type4: IngredientType
    qty4: number

    ingredient5: string
    type5: IngredientType
    qty5: string

    ingredient6: string
    type6: IngredientType
    qty6: number

    ingredient7: string
    type7: IngredientType
    qty7: number

    cooldownSeconds: number
    cooldownQuantity: number
}

export type CraftingDatasheet = [RawRecipe]