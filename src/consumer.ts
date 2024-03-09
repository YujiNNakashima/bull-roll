import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import pool from './db';

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});


export default new Worker(
  'messageQueue',
  async (job) => {
    console.log('Received message:', job.data.text);

    try {
      const queryText = 'INSERT INTO messages(text) VALUES($1)';
      await pool.query(queryText, [job.data.text]);
    } catch (error) {
      console.error(error)
    }
    return job.data.text
  }, {
  connection
}

);
