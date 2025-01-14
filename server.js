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
  credentials: false, // add this
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-rapidapi-key', 'x-rapidapi-host'], 
}));

// app.use(cors({
//   origin: ['*'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'x-rapidapi-key', 'x-rapidapi-host'], 
// }));

// app.options('*', cors()); // test

// const corsOptions = {
//   origin: ['http://localhost:3000', 'https://airline-point-website-server.vercel.app'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'x-rapidapi-key', 'x-rapidapi-host'],
// };

// app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));

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

// Register
app.post("/api/user/register", (req, res) => {
  userService.registerUser(req.body)
  .then((msg) => {
      res.json({ "message": msg });
  }).catch((msg) => {
      res.status(422).json({ "message": msg });
  });
});

// Login
app.post("/api/user/login", (req,res)=>{
  userService.checkUser(req.body)
  .then((user) =>{
    const payload ={
      _id:user._id,
      userName: user.userName,
    };

    const token = jwt.sign(payload,process.env.JWT_SECRET);

    res.json({"message": "Login successful",
      "token": token
    });
  }).catch(msg =>{
    res.status(422).json({"message":msg});
  });
});

// get comparsion list
app.get("/api/user/comparsion", passport.authenticate('jwt', { session: false }), (req, res) =>{
  userService.getComparsion(req.user._id)
  .then(data =>{
    res.json(data);
  }).catch(msg =>{
    res.status(422).json({error: msg});
  });
});


// Add comparsion list
app.put("/api/user/comparsion/:id", passport.authenticate('jwt', {session: false}), (req, res) =>{
  userService.addComparsion(req.user._id, req.params.id)
  .then(data =>{
    res.json(data)
  }).catch(msg =>{
    res.status(422).json({ error: msg });
  });
});

// Delete comparsion list

app.delete("/api/user/comparsion/:id", passport.authenticate('jwt', {session : false}), (req, res) =>{
  userService.removeComparsion(req.user._id, req.params.id)
  .then(data =>{
    res.json(data)
  }).catch(msg =>{
    res.status(422).json({error: msg});
  });
});


// Get History
app.get("/api/user/history", passport.authenticate('jwt', {session:false}), (req,res) =>{
  userService.getHistory(req.user._id)
  .then(data =>{
    res.json(data);
  }).catch( msg =>{
    res.status(422).json({ error:msg });
  });
});


// Add history
app.put("/api/user/history/:id", passport.authenticate('jwt', {session:false}), (req,res) =>{
  userService.addHistory(req.user._id, req.params.id)
  .then(data =>{
    res.json(data);
  }).catch( msg =>{
    res.status(422).json({error : msg});
  });
});


// Delete history
app.delete("/api/user/history/:id", passport.authenticate('jwt', {session: false}), (req, res) =>{
  userService.removeHistory(req.user._id, req.params.id)
  .then(data =>{
    res.json(data);
  }).catch(msg =>{
    res.status(422).json({error : msg});
  });
});



app.get('/api/user/calculator', async (req, res) => {
    const { iata } = req.query; 
  
    if (!iata) {
      return res.status(400).json({ error: 'Missing required parameter: iata' });
    }
  
    try {
      
      console.log('Fetching airport data for:', iata); // test
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


// app.connect()
// .then(() =>{
//   app.listen(HTTP_PORT,() => console.log(`server listening on: ${HTTP_PORT}`));
// }).catch((err) => {
//   console.log("unable to start the server: " + err);
//   process.exit();
// });

app.listen(HTTP_PORT,() => console.log(`server listening on: ${HTTP_PORT}`));


// userService.connect()
// .then(() => {
//     app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
// })