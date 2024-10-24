import express from 'express';
import { restaurantController } from '../Controllers/RestaurantController';
const routerIndex = express.Router();

routerIndex.post("/store", restaurantController.create.bind(restaurantController));
routerIndex.get("/list/:id", restaurantController.list.bind(restaurantController));

export default routerIndex;