
import { Restaurant } from "../Models/Restaurant";
import { Request, Response } from 'express';
import { RestaurantCreate } from "../Validation/RestaurantValidation";
import redis from "../configs/redis"

class RestaurantController{

 async create(req: Request, res: Response): Promise<any>{
        try {
          const data = req.body;
            const {error} = RestaurantCreate.validate(data);
            if(error){
                const errors = new Error(error.details[0].message);
                (errors as any).status = 400;
                throw errors;
            }     
            const restaurant = await Restaurant.create(data);
            const redisKey = `restaurant:${restaurant.id}`;
            const result = await redis.hset(redisKey,{
                name: restaurant.name,
                location: restaurant.location,
                menu: data.menus || []
            });     
           console.log( {"result":result});
            return res.status(201).json({
                "restaurant":restaurant
        });
        } catch (error) {
            console.log(error);
        }
    }

    async list(req:Request, res:Response): Promise<any>{
        const restaurantId = req.params.id;
        try {
          const restaurantExists= await redis.exists(restaurantId)
          if(!restaurantExists){
            return res.status(404).json({'message': "not found"});
          }
          const restaurant= await redis.hgetall(restaurantId);
          const viewRestaurants= await redis.hincrby(restaurantId,"viewCount",1);
          return res.status(200).json({"restaurant":restaurant, "viewCount":viewRestaurants});
        }catch(err){

        }
    }
}
export const restaurantController = new RestaurantController();