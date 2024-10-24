import express from 'express';
const connectDB = require("./configs/database");
import dotenv from 'dotenv';
import routerIndex from './Routes/IndexRoute';
const app = express();
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectDB();
app.use("/api/v1/restaurants", routerIndex);
const PORT = process.env.PORT; 
app.listen(PORT, () =>
    console.log(
        `Node API app is running in ${process.env.NODE_ENV} mode on port ${PORT}`
    )
);
