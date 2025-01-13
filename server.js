const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportJWT = require('passport-jwt');
const userService = require('./user-service.js');
dotenv.config();


const HTTP_PORT = process.env.PORT || 8080;

const MONGO_URL = process.env.MONGO_URL;

app.use(cors({
  origin: ['http://localhost:3000','https://airline-point-website-server.vercel.app'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-rapidapi-key', 'x-rapidapi-host'], 
}));

mongoose.connect(MONGO_URL)
  .then(()=>{console.log('Connect to MongoDB!')})
  .catch((err)=>{
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;

let jwtOption = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
  secretOrKey: process.env.JWT_SECRET,
  
}

let strategy = new JwtStrategy(jwtOption, function (jwt_payload, next){
  console.log('payload received', jwt_payload);
  if(jwt_payload){
      next(null, {
          _id:jwt_payload._id,
          userName:jwt_payload.userName,
      });
  }else{
      next(null,false);
  }
});

passport.use(strategy);
app.use(express.json());
app.use(passport.initialize());

app.post("/api/user/register", (req, res) => {
  userService.registerUser(req.body)
  .then((msg) => {
      res.json({ "message": msg });
  }).catch((msg) => {
      res.status(422).json({ "message": msg });
  });
});

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