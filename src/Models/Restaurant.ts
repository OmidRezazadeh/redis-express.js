import { Schema, model,ObjectId } from 'mongoose';
export interface Restaurant {
    _id: ObjectId;
    name: string;
    location: string;
    cuisines: string[]; // Array of menu _id references
}
const restaurantSchema = new Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    cuisines: [ ] // Reference to Menu model
})
export const Restaurant=model("Restaurant",restaurantSchema);
