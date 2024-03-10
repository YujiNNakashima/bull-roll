/* eslint-disable @typescript-eslint/no-implicit-any */
import express from 'express';
import { createServer } from 'http';
import { addMessage } from './producer';
import worker from './consumer'
import pool from './db';

const app = express();
const server = createServer(app);

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());

const router = express.Router();
app.use("/api", router)

// SSE endpoint
router.get('/events', function (req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const fetchAndSendMessages = () => {
    pool.query('SELECT * FROM messages ORDER BY created_at ASC', (error: any, result: any) => {
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      sendEvent(result.rows);
    });
  };
  fetchAndSendMessages();

  const pollInterval = setInterval(fetchAndSendMessages, 2000);

  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(pollInterval);
    clearInterval(keepAlive);
  });
});

router.post('/send-message', async (req, res) => {
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

router.get('/messages', async (req, res) => {
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

router.delete('/messages', async (req, res) => {
  try {
    await pool.query('DELETE FROM messages');
    res.status(200).send('All messages deleted successfully.');
  } catch (error) {
    console.error('Error deleting messages:', error);
    res.status(500).send('Failed to delete messages.');
  }
})

if (process.env.NODE_ENV === 'development') {
  router.post('/seed', async (req, res) => {
    try {
      await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        text VARCHAR(255) NOT NULL,
        worker_id VARCHAR(255),
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

// start workers
worker

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
