import express from 'express';
import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import { addMessage } from './producer';
import worker from './consumer'
import pool from './db';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static('public'));
app.use(express.json());

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    addMessage(message.toString());
  });
});

const baseRouter = express.Router();
app.use("/api", baseRouter)

baseRouter.get('/messages', async (req, res) => {
  try {
    const data = await pool.query(`
      SELECT * FROM messages;
    `)
    res.status(200).json({
      data: data.rows
    })
  } catch (error) {
    res.status(500).json({
      error
    })
  }
})

if (process.env.NODE_ENV === 'development') {
  baseRouter.post('/seed', async (req, res) => {
    try {
      await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        text VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
      await pool.query(`
      INSERT INTO messages (text) VALUES ('Hello, world!'), ('Another message')
    `);
      res.send('Database seeded successfully.');
    } catch (error) {
      console.error('Database seeding failed:', error);
      res.status(500).send('Database seeding failed.');
    }
  });
}

// start worker
worker

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
