import { Request, Response } from "express"; // Import Request and Response types from Express for type definitions
import redis from "../configs/redis"; // Import the Redis instance from the configuration

import { cuisinesKey } from "../Utils/key";
class CuisineController {
  async list(req: Request, res: Response): Promise<any> {
    try {
      const cuisines = await redis.smembers(cuisinesKey);
      return res.status(200).json(cuisines);
    
    } catch (err) {
      console.log(err);
    }
  }
}

export const cuisineController = new CuisineController();
