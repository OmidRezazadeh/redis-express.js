import express from 'express';
import { restaurantController } from '../Controllers/RestaurantController';
const routerIndex = express.Router();

routerIndex.post("/store", restaurantController.create.bind(restaurantController));
routerIndex.get("/list/:id", restaurantController.list.bind(restaurantController));
routerIndex.post("/review/:id", restaurantController.review.bind(restaurantController));
routerIndex.get("/get-list/:id", restaurantController.getList.bind(restaurantController));
routerIndex.delete("/:restaurant_id/reviews/:review_id", restaurantController.delete.bind(restaurantController));
routerIndex.get("/paginate",restaurantController.paginate.bind(restaurantController));
routerIndex.post("/:id/details",restaurantController.details.bind(restaurantController));
routerIndex.get("/:id/details",restaurantController.getDetails.bind(restaurantController));
routerIndex.get("/search",restaurantController.search.bind(restaurantController));
export default routerIndex;