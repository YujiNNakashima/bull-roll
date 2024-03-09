/* eslint-disable @typescript-eslint/no-implicit-any */
import express from 'express';
import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import { addMessage } from './producer';
import worker from './consumer'
import pool from './db';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());

const api = express.Router();
app.use("/api", api)


api.post('/send-message', async (req, res) => {
  try {
    const { message } = req.body;
    console.log(req.body);

    if (!message) {
      return res.status(400).send('Message is required');
    }

    await addMessage(message);

    res.end();
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send('Error sending message');
  }
})


api.get('/messages', async (req, res) => {
  try {
    const data = await pool.query(`
      SELECT * FROM messages;
    `)


    if (data.rows.length > 0) {
      const messages = data.rows.map((row: any) => {
        return `<li>${row.text}</li>`;
      });
      const messagesHtml = messages.join('');
      const htmlResponse = `<ul>${messagesHtml}</ul>`;

      res.send(htmlResponse);

    } else {

      res.send(`<li>
      não há mensagem
      </li>`)
    }

  } catch (error) {
    res.status(500).json({
      error
    })
  }
})

if (process.env.NODE_ENV === 'development') {
  api.post('/seed', async (req, res) => {
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
