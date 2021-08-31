import {crafting} from "./generators/crafting";
import {convert} from "./generators/convert";

convert().then(() => {
    console.log("Generating Crafting Info...")
    crafting()
})

