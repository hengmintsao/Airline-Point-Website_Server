const dotenv = require('dotenv');

const express = require('express');
const app = express();
const cors = require('cors');
dotenv.config();


const HTTP_PORT = process.env.PORT || 8080;

app.use(cors({
  origin: ['http://localhost:3000','https://airline-point-website-server.vercel.app/'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-rapidapi-key', 'x-rapidapi-host'], 
}));

app.get('/calculator', async (req, res) => {
    const { iata } = req.query; 
  
    if (!iata) {
      return res.status(400).json({ error: 'Missing required parameter: iata' });
    }
  
    try {
      
      const response = await fetch(
        `https://airport-info.p.rapidapi.com/airport?iata=${iata}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY, 
            'x-rapidapi-host': 'airport-info.p.rapidapi.com',
          },
        }
      );
  
      
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: `Failed to fetch airport data: ${response.statusText}` });
      }
  
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching data:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
console.log('RAPIDAPI_KEY:', process.env.RAPIDAPI_KEY);
app.listen(HTTP_PORT,() => console.log(`server listening on: ${HTTP_PORT}`));