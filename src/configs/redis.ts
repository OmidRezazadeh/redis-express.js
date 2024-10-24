import  Redis from 'ioredis';
const redis =new Redis({
    host:'localhost',
    port: 6379,
});
redis.on('connect',() => {
console.log('Connected to Redis');
})
redis.on('error',() =>{
    console.log('Error connecting to Redis');
});

export default redis;