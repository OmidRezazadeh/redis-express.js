import { Restaurant } from "../Models/Restaurant"; // Import the Restaurant model from the Models folder
import { Request, Response } from "express"; // Import Request and Response types from Express for type definitions
import { RestaurantCreate } from "../Validation/RestaurantValidation"; // Import the validation schema for restaurant creation
import redis from "../configs/redis"; // Import the Redis instance from the configuration
import shortid from "shortid"; // Import shortid to generate unique IDs for reviews
import {
  cuisineKey,
  cuisinesKey,
  restaurantCuisinesKeyById,
  restaurantKeyById,
  restaurantsByRatingKey,
  reviewDetailsKeyById,
  reviewKeyById,
} from "../Utils/key"; // Import utility functions for generating Redis keys based on IDs


class RestaurantController {
  
  async paginate(req: Request, res: Response): Promise<any>{
    const { page = 1, limit = 10 } = req.query; // Pagination parameters with default values
    const start = (Number(page) - 1) * Number(limit); // Calculate starting index
    const end = start + Number(limit) - 1; // Calculate ending index
    try{
      const  restaurantIds= await redis.zrange(
             restaurantsByRatingKey
             ,start
             ,end,
             'WITHSCORES'
      )
      const restaurants = await  Promise.all( 
        restaurantIds.map((id)=> redis.hgetall(restaurantKeyById(id)))
        
      )
      return res.status(200).json({"restaurants": restaurants});  
  }catch (error) {
console.log(error);
  }
}
  // Retrieves a list of reviews for a specific restaurant with pagination
  async getList(req: Request, res: Response): Promise<any> {
    const restaurantId = req.params.id; // Restaurant ID from the URL parameters
    const { page = 1, limit = 10 } = req.query; // Pagination parameters with default values
    const start = (Number(page) - 1) * Number(limit); // Calculate starting index
    const end = start + Number(limit) - 1; // Calculate ending index

    try {
      const reviewKey = reviewKeyById(restaurantId); // Generate Redis key for the restaurant's reviews
      const reviewIds = await redis.lrange(reviewKey, start, end); // Fetch review IDs from Redis
      const reviews = await Promise.all(
        reviewIds.map((id) => redis.hgetall(reviewDetailsKeyById(id))) // Retrieve review details for each review ID
      );
      res.status(200).json({ reviews: reviews }); // Send the list of reviews as the response
    } catch (err) {
      console.log(err); // Log error to the console if one occurs
    }
  }

  // Adds a new review for a specific restaurant
  async review(req: Request, res: Response): Promise<any> {
    const restaurantId = req.params.id; // Restaurant ID from URL parameters
    try {
      const restaurantKey = restaurantKeyById(restaurantId); // Generate Redis key for the restaurant
      const restaurantExists = await redis.exists(restaurantKey); // Check if the restaurant exists in Redis
      if (!restaurantExists) {
        return res.status(200).json({ "message": "not found Restaurant" }); // Return if restaurant is not found
      }

      const reviewId = shortid.generate(); // Generate unique ID for the review
      const reviewKey = reviewKeyById(restaurantId); // Redis key for storing the review ID list
      const { review, rating } = req.body; // Extract review and rating from request body
       
      const reviewDetailsKey = reviewDetailsKeyById(reviewId); // Generate Redis key for storing review details
      const reviewData = {
        id: reviewId,
        review,
        rating,
        restaurantId,
      };

      const [reviewCountRaw, setResult, totalStarsRaw] = await Promise.all([
        redis.lpush(reviewKey, reviewId), // Add review ID to Redis list
        redis.hset(reviewDetailsKey, reviewData), // Store review details in Redis hash
        redis.hincrbyfloat(restaurantKey, "totalStars", rating), // Increment total stars
      ]);

 // Ensure reviewCount is a number
const reviewCount = Number(reviewCountRaw);
// Ensure totalStars is a number
const totalStars = Number(totalStarsRaw);

const averageRating = Number((totalStars / reviewCount).toFixed(1));

await Promise.all([
  redis.zadd(restaurantsByRatingKey, averageRating,restaurantId),
   redis.hset(restaurantKey,'avgStars',averageRating)
])
      res.status(200).json({ viewData: reviewData }); // Respond with the created review data
    } catch (err) {
      console.log(err); // Log error if any occurs
    }
  }

  // Creates a new restaurant and stores its data in Redis
  async create(req: Request, res: Response): Promise<any> {
    try {
      const data = req.body; // Extract restaurant data from request body
      const { error } = RestaurantCreate.validate(data); // Validate input data
      if (error) {
        const errors = new Error(error.details[0].message); // Return validation error if data is invalid
        (errors as any).status = 400;
        throw errors;
      }

      const id = shortid.generate(); // Generate unique ID for the restaurant
      const restaurant = await Restaurant.create(data); // Create restaurant entry in the database
      const restaurantKey = restaurantKeyById(id); // Redis key for storing restaurant data
      const hashData = {
        name: restaurant.name,
        location: restaurant.location,
        id
      };

      await Promise.all([
        ...data.cuisines.map((cuisine: any) =>
          Promise.all([
            redis.sadd(cuisinesKey, cuisine), // Add cuisine to global cuisine set
            redis.sadd(cuisineKey(cuisine), id), // Add restaurant ID to specific cuisine set
            redis.sadd(restaurantCuisinesKeyById(id), cuisine), // Link cuisine to the restaurant
          ])
        ),
        await redis.hset(restaurantKey, hashData), // Store restaurant details in Redis hash
        await redis.zadd(restaurantsByRatingKey, 0,id )
      ]);

      return res.status(201).json({ "redis": hashData }); // Respond with created restaurant data
    } catch (error) {
      console.log(error); // Log error if any occurs
    }
  }

  // Retrieves details of a specific restaurant and increments its view count
  async list(req: Request, res: Response): Promise<any> {
    let restaurantId = req.params.id; // Restaurant ID from URL parameters
    try {
      const restaurantKey = restaurantKeyById(restaurantId); // Generate Redis key for the restaurant
      const restaurantExists = await redis.exists(restaurantKey); // Check if the restaurant exists in Redis
      if (!restaurantExists) {
        return res.status(404).json({ message: "not found" }); // Return if restaurant is not found
      }

      const [viewCount, restaurant, cuisines] = await Promise.all([
        await redis.hincrby(restaurantKey, "viewCount", 1), // Increment view count in Redis
        await redis.hgetall(restaurantKey), // Fetch restaurant details
        await redis.smembers(restaurantCuisinesKeyById(restaurantId)), // Fetch cuisines associated with the restaurant
      ]);

      return res.status(200).json({ restaurant, cuisines }); // Respond with restaurant details and cuisines
    } catch (err) {
      console.log(err); // Log error if any occurs
    }
  }

  // Deletes a specific review for a restaurant
  async delete(req: Request, res: Response): Promise<any> {
    const { restaurant_id, review_id } = req.params; // Extract restaurant and review IDs from URL parameters

    try {
      const reviewKey = reviewKeyById(restaurant_id); // Redis key for the restaurant's review list
      const reviewDetailsKey = reviewDetailsKeyById(review_id); // Redis key for review details

      const [removeResult, deleteResult] = await Promise.all([
        redis.lrem(reviewKey, 0, review_id), // Remove review ID from the Redis list
        redis.del(reviewDetailsKey), // Delete review details from Redis
      ]);

      if (removeResult === 0 && deleteResult === 0) {
        return res.status(404).json({ message: "Review not found" }); // Return if review is not found
      }

      return res.status(200).json({ reviews: review_id, message: "Review deleted" }); // Respond with deletion confirmation
    } catch (error) {
      console.log(error); // Log error if any occurs
    }
  }
}

export const restaurantController = new RestaurantController();
