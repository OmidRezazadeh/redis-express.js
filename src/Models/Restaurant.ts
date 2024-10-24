import { Schema, model,ObjectId } from 'mongoose';
export interface Restaurant {
    _id: ObjectId;
    name: string;
    location: string;
    menus: string[]; // Array of menu _id references
}
const restaurantSchema = new Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    menus: [{ type: Schema.Types.ObjectId, ref: 'Menu' }] // Reference to Menu model
})
export const Restaurant=model("Restaurant",restaurantSchema);
