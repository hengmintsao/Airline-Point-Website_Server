const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportJWT = require('passport-jwt');
const userService = require('./user-service.js');
// const fs = require('fs'); // For adding airport data purpose(Finished)
// const Airport = require('./airport-data.js'); // For adding airport data purpose(Finished)
dotenv.config();



const HTTP_PORT = process.env.PORT || 8080;

const MONGO_URL = process.env.MONGO_URL;

app.use(cors({
  origin: ['http://localhost:3000','https://airline-point-website-server.vercel.app'],
  credentials: true, // add this
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-type', 'Authorization', 'x-rapidapi-key', 'x-rapidapi-host'], 
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


// For adding airport data purpose(Finished)
// function initializeAirportData(){
//   const dataPath = '../side project/airport_database.txt';
//   const airportCount = Airport.countDocuments();

//   if(airportCount === 0){
//     console.log('No airport data.');
//   }

//   const fileContent = fs.readFileSync(dataPath, 'utf-8');
//   const lines = fileContent.split('\n');
//   const header = lines.shift();

//   for (const line of lines) {
//     const [icao, iata, name, city, subd, country] = line.split(',').map(field => field.replace(/^"|"$/g, '').trim());

//     if (!iata || iata.trim() === '' || iata.trim().length === 0) continue;

//     const displayName = `${iata.trim()} - ${name.trim()}, ${city.trim()}, ${country.trim()}`;


//     try {
      
//       Airport.create({
//         iata: iata.trim(),
//         displayName,
//       });
//     } catch (err) {
//       console.error(`There is an error inserting data: ${line}`, err.message);
//     }
//   }
// }
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
  console.log("Request body:", req.body); // test code
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
    const payload = {
      _id: user._id,
      userName: user.userName,
      email: user.email,
      nationality: user.nationality,
      mainAirport: user.mainAirport,
      preferenceCarrier: user.preferenceCarrier,
      preferenceAlliance: user.preferenceAlliance,
    };

    const token = jwt.sign(payload,process.env.JWT_SECRET);

    res.json({"message": "Login successful",
      "token": token
    });
  }).catch(msg =>{
    res.status(422).json({"message":msg});
  });
});


// Get user information by ID
app.get("/api/user", passport.authenticate('jwt', {session: false}), (req,res) =>{
  userService.getUser(req.user._id)
    .then(user =>{
      res.json(user);
    }).catch(msg =>{
      res.status(404).json({error:msg});
    })
})


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
app.put("/api/user/history", passport.authenticate('jwt', {session:false}), (req,res) =>{
  const {historyData} = req.body;
  console.log('Received historyData:', historyData);
  if (!historyData) {
    return res.status(400).json({ error: 'Missing historyData in request body' });
}
  userService.addHistory(req.user._id, historyData )
  .then(data =>{
    res.json(data);
  }).catch( msg =>{
    res.status(422).json({error : msg});
  });
});


// Delete history
app.delete("/api/user/history", passport.authenticate('jwt', {session: false}), (req, res) =>{
  const {historyData} = req.body;
  userService.removeHistory(req.user._id, historyData)
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
//console.log('RAPIDAPI_KEY:', process.env.RAPIDAPI_KEY); test code

app.get('/api/users/countries', async(req,res) =>{
  try{
    const response = await fetch('https://www.apicountries.com/countries');
    if (!response.ok) {

      throw new Error(`Error fetching countries: ${response.statusText}`);
    }
    const data = await response.json();
    res.json(data);

  }catch(err){
    res.status(500).json({error: err.message});
  }
});


// app.connect()
// .then(() =>{
//   app.listen(HTTP_PORT,() => console.log(`server listening on: ${HTTP_PORT}`));
// }).catch((err) => {
//   console.log("unable to start the server: " + err);
//   process.exit();
// });

//app.listen(HTTP_PORT,() => console.log(`server listening on: ${HTTP_PORT}`));


userService.connect()
.then(() => {
    app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
    // initializeAirportData(); // For adding airport data purpose(Finished)
})