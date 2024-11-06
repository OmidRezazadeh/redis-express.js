import redis from "../configs/redis"; // Import the Redis instance from the configuration
import { indexKey, getKeyName } from "../Utils/key";

async function createIndex() {
  await redis.call(
    'FT.CREATE',
    indexKey,
    'ON',
    'HASH',
    'PREFIX',
    '1',
    'restaurant:',
    'SCHEMA',
    'name',
    'TEXT',
    'cuisines', 'TAG'
  );
  console.log('Index created');
}

module.exports = { createIndex };