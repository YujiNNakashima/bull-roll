import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
});


const queue = new Queue('messageQueue', {
  connection
});

export async function addMessage(message: string) {
  console.log('in addMessage')
  await queue.add('messageJob', { text: message },
    { removeOnComplete: true, removeOnFail: true });
}
