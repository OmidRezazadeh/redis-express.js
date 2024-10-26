import Joi from "joi";
export const RestaurantCreate =Joi.object({
    name:Joi.string().required().messages({
        'string.empty': 'Name is required',
    }),
    location: Joi.string().required().min(5).max(200).messages({
        'string.empty': 'Location is required',
        'string.min': 'Location should have at least 5 characters',
        'string.max': 'Location should have at most 200 characters'
      }),
      price: Joi.number().optional().min(0).messages({
        'number.base': 'Price must be a number',
        'number.min': 'Price cannot be negative'
      }),
      cuisines: Joi.array().optional().min(1)
})