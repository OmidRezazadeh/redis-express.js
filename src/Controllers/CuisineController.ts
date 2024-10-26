import { Request, Response } from "express"; // Import Request and Response types from Express for type definitions
import redis from "../configs/redis"; // Import the Redis instance from the configuration

import { restaurantKeyById,cuisinesKey,cuisineKey } from "../Utils/key";
class CuisineController {
  async list(req: Request, res: Response): Promise<any> {
    try {
      const cuisines = await redis.smembers(cuisinesKey);
      return res.status(200).json({"cuisines":cuisines});
    
    } catch (err) {
      console.log(err);
    }
  }
  async getList(req: Request, res: Response): Promise<any>{
        const cuisineId = req.params.id;
        try {
            const restaurantIds = await redis.smembers(cuisineKey(cuisineId));
             const restaurants =await Promise.all(
                restaurantIds.map((restaurantId)=> redis.hget(restaurantKeyById(restaurantId),"name"))
             );
             return res.status(200).json({"restaurants": restaurants});
        }catch(err){

        }
  }
}

export const cuisineController = new CuisineController();
