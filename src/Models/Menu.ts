import { Schema, model,ObjectId } from 'mongoose';

export interface MENUS {
    _id: ObjectId;
    name: string;
    description: string;
    price: number;
    restaurantId: string;

}

const menuSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true }
})

export const MENU =model("Menu",menuSchema)