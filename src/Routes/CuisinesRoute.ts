import {cuisineController}  from '../Controllers/CuisineController';
import express from 'express';

const cuisineRoute = express.Router();
cuisineRoute.get("/list",cuisineController.list.bind(cuisineController))
export default cuisineRoute;