import express from 'express';
import { restaurantController } from '../Controllers/RestaurantController';
const routerIndex = express.Router();

routerIndex.post("/store", restaurantController.create.bind(restaurantController));
routerIndex.get("/list/:id", restaurantController.list.bind(restaurantController));
routerIndex.post("/review/:id", restaurantController.review.bind(restaurantController));
routerIndex.get("/get-list/:id", restaurantController.getList.bind(restaurantController));
export default routerIndex;