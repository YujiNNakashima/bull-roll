import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import pool from './db';
import { v4 as uuidv4 } from 'uuid';

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

const workers = [] as any[]
for (let i = 0; i < 3; i++) {
  const workerId = uuidv4();

  const worker = new Worker(
    'messageQueue',
    async (job) => {
      console.log('Received message:', job.data.text);
      try {
        const queryText = 'INSERT INTO messages(text, worker_id) VALUES($1, $2)';
        await pool.query(queryText, [job.data.text, workerId]);
      } catch (error) {
        console.error(error)
      }
      return job.data.text
    }, {
    connection,
    concurrency: 5
  }
  );

  workers.push(worker)
}


export default workers