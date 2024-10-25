import { Restaurant } from "../Models/Restaurant"; // Import the Restaurant model from the Models folder
import { Request, Response } from "express"; // Import Request and Response types from Express for type definitions
import { RestaurantCreate } from "../Validation/RestaurantValidation"; // Import the validation schema for restaurant creation
import redis from "../configs/redis"; // Import the Redis instance from the configuration
import shortid from "shortid"; // Import shortid to generate unique IDs for reviews
import {
  restaurantKeyById,
  reviewDetailsKeyById,
  reviewKeyById,
} from "../Utils/key"; // Import utility functions for generating Redis keys based on IDs

class RestaurantController {
  // Fetch a list of reviews for a given restaurant
  async getList(req: Request, res: Response): Promise<any> {
    const restaurantId = req.params.id; // Extract the restaurant ID from request params
    const { page = 1, limit = 10 } = req.query; // Get pagination details from query params, with default values
    const start = (Number(page) - 1) * Number(limit); // Calculate the start index for the Redis query
    const end = start + Number(limit) - 1; // Calculate the end index for the Redis query
    try {
      const reviewKey = reviewKeyById(restaurantId); // Get the Redis key for the restaurant's reviews
      const reviewIds = await redis.lrange(reviewKey, start, end); // Fetch a range of review IDs from Redis
      const reviews = await Promise.all(
        reviewIds.map((id) => redis.hgetall(reviewDetailsKeyById(id))) // Fetch review details for each review ID
      );
      res.status(200).json({ reviews: reviews }); // Return the list of reviews in JSON format
    } catch (err) {
      console.log(err);
      // Handle any errors here
    }
  }

  // Add a new review to a restaurant
  async review(req: Request, res: Response): Promise<any> {
    const restaurantId = req.params.id; // Get the restaurant ID from request params
    try {
      const restaurantExists = await redis.exists(restaurantId); // Check if the restaurant exists in Redis
      if (!restaurantExists) {
        return res.status(404).json({ message: "not found" }); // Return 404 if the restaurant doesn't exist
      }
      const { review, rating } = req.body; // Extract review and rating from the request body
      const reviewId = shortid.generate(); // Generate a unique review ID using shortid
      const reviewKey = reviewKeyById(restaurantId); // Get the Redis key for the restaurant's reviews
      const reviewDetailsKey = reviewDetailsKeyById(reviewId); // Get the Redis key for the review's details
      const reviewData = {
        id: reviewId,
        review,
        rating,
        restaurantId,
      };

      await Promise.all([
        redis.lpush(reviewKey, reviewId), // Add the review ID to the list of reviews in Redis
        redis.hset(reviewDetailsKey, reviewData), // Store the review details in a Redis hash
      ]);
      res.status(200).json({ viewData: reviewData }); // Return the added review in the response
    } catch (err) {
      console.log(err); // Log any errors
    }
  }

  // Create a new restaurant
  async create(req: Request, res: Response): Promise<any> {
    try {
      const data = req.body; // Get restaurant data from the request body
      const { error } = RestaurantCreate.validate(data); // Validate the input data using the validation schema
      if (error) {
        const errors = new Error(error.details[0].message); // Create an error object with the validation message
        (errors as any).status = 400;
        throw errors; // Throw the validation error
      }
      const restaurant = await Restaurant.create(data); // Create the restaurant in the database
      const redisKey = `restaurant:${restaurant.id}`; // Create a Redis key for the new restaurant
      const result = await redis.hset(redisKey, {
        name: restaurant.name,
        location: restaurant.location,
        menu: data.menus || [], // Set the menu or default to an empty array
      });
      console.log({ result: result }); // Log the Redis operation result
      return res.status(201).json({
        restaurant: restaurant, // Return the created restaurant in the response
      });
    } catch (error) {
      console.log(error); // Log any errors
    }
  }

  // Fetch details of a specific restaurant
  async list(req: Request, res: Response): Promise<any> {
    const restaurantId = req.params.id; // Get the restaurant ID from request params
    try {
      const restaurantExists = await redis.exists(restaurantId); // Check if the restaurant exists in Redis
      if (!restaurantExists) {
        return res.status(404).json({ message: "not found" }); // Return 404 if the restaurant doesn't exist
      }
      const restaurant = await redis.hgetall(restaurantId); // Fetch restaurant details from Redis
      const viewRestaurants = await redis.hincrby(restaurantId, "viewCount", 1); // Increment the view count in Redis
      return res
        .status(200)
        .json({ restaurant: restaurant, viewCount: viewRestaurants }); // Return the restaurant details and view count
    } catch (err) {
      // Handle any errors here
      console.log(err);
    }
  }

  async delete(req: Request, res: Response): Promise<any> {
    // Extract restaurant_id and review_id from the request parameters
    const { restaurant_id, review_id } = req.params;
    
    try {
      // Generate the Redis key for the list of reviews associated with the restaurant
      const reviewKey = reviewKeyById(restaurant_id);
  
      // Log the IDs to ensure they were extracted correctly
      console.log(review_id, restaurant_id);
  
      // Generate the Redis key for the specific review details based on review_id
      const reviewDetailsKey = reviewDetailsKeyById(review_id);
  
      // Execute both deletion operations in parallel:
      // - Remove the review ID from the restaurant's review list
      // - Delete the detailed review data from Redis
      const [removeResult, deleteResult] = await Promise.all([
        redis.lrem(reviewKey, 0, review_id), // Remove review_id from the list
        redis.del(reviewDetailsKey),          // Delete the review details entry
      ]);
  
      // Check if both deletions were unsuccessful (keys not found)
      if (removeResult === 0 && deleteResult === 0) {
        console.log(removeResult, deleteResult);
        return res.status(404).json({ message: "Review not found" });
      }
  
      // If deletion was successful, return a success response with the review ID
      return res.status(200).json({ reviews: review_id, message: "Review deleted" });
    } catch (error) {
      // Log any error that occurs during deletion
      console.log(error);
    }
  }
  
}
export const restaurantController = new RestaurantController(); // Export an instance of RestaurantController
