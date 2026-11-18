export type Category = "Vegetables" | "Fruits"

export type Product = {
    category:  Category;
    price: string;
    stocked: boolean
    name: string;
}