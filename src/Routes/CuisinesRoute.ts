import {cuisineController}  from '../Controllers/CuisineController';
import express from 'express';

const cuisineRoute = express.Router();
cuisineRoute.get("/list/:id",cuisineController.list.bind(cuisineController))
cuisineRoute.get("/get-list/:id",cuisineController.getList.bind(cuisineController))
export default cuisineRoute;