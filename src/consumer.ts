import { Worker } from 'bullmq';
import IORedis from 'ioredis';

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
    return job.data.text
  }, {
  connection
}
);
