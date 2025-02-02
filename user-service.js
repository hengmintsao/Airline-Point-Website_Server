const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

let mongoDBConnection = process.env.MONGO_URL;

let Schema = mongoose.Schema;

let userSchema = new Schema({
    userName:{
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type:String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        validate: {
            validator: function(value){
                return validator.isEmail(value);
            },
            message: 'Invalid email format'
        }
    },
    nationality:{ 
        type: String,
        required: true
    },
    mainAirport: {
        type: String,
        required: true
    },
    preferenceCarrier: [String],
    preferenceAlliance: [String],
    comparsion: [String],
    history: [Schema.Types.Mixed],
});

const User = mongoose.model('users', userSchema);

// set up user model, implement mongoDB connection and resolve the promise when connection is ready
// module.exports.connect = function(){
//     return new Promise(function(resolve, reject){

//         let db = mongoose.createConnection(mongoDBConnection);

//         db.on('error', err => {
//             reject(err.message);
//         });

//         db.once('open', () =>{
//             User = db.model("users", userSchema);
//             resolve(User);
//         });

//     });
// };



// Register a new user, hash password and save the user data to the database
module.exports.registerUser = function (userData){
    console.log("Received userData:", userData);
    return new Promise(function (resolve, reject){

        if(userData.password != userData.password2){
            reject("Passwords do not match");
        }

        if(!userData.email) {
            return reject("Missing required field: email");
        }
          
        if(!userData.nationality) {
            return reject("Missing required field: nationality");
        }
          
        if (!userData.mainAirport) {
            return reject("Missing required field: mainAirport");
        }

        bcrypt.hash(userData.password, 10).then(hash =>{

            userData.password = hash;

            let newUser = new User(userData);

            newUser.save().then(()=>{
                resolve("User " + userData.userName + " successfully registered");
            }).catch(err => {
                // if 11000 means violate unique
                if(err.code == 11000){
                    reject("User name already taken");
                }else{
                    reject("There was an error creating the user: " + err.message);
                }
            })
        }).catch(err => reject(err.message));
    });
};

// Check if user is matched in database
module.exports.checkUser = function(userData){
    return new Promise(function(resolve, reject){

        User.findOne({userName: userData.userName})
            .exec()
            .then(user =>{
                bcrypt.compare(userData.password, user.password).then(res =>{
                    if (res === true){
                        resolve(user);
                    }else{
                        reject("Incorrect password for user " + userData.userName);
                    }
                });
            }).catch(err =>{
                reject("Unable to find user " + userData.userName + "Error message: " + err.message);
            });
        
    });
};


// Get user information by userName
module.exports.getUserById = function (id) {
    return new Promise(function (resolve, reject) {
      User.findById(id)
        .select("-password") 
        .exec()
        .then(user => {
          if (user) {
            resolve(user);
          } else {
            reject(`User with userName ${id} not found`);
          }
        })
        .catch(err => {
          reject(`Error finding user: ${err.message}`);
        });
    });
  };

// Update user Profile
module.exports.updateUserProfile = function (id, userData) {
    return new Promise((resolve, reject) => {
      
      const updateFields = {
        user: userData.userName,
        email: userData.email,
        nationality: userData.nationality,
        mainAirport: userData.mainAirport,
        preferenceCarrier: userData.preferenceCarrier,
        preferenceAlliance: userData.preferenceAlliance,
       
      };
      User.findByIdAndUpdate(
        id,
        updateFields,
        {
          new: true,         
          runValidators: true 
        }
      )
        .select("-password") 
        .exec()
        .then(updatedUser => {
          if (!updatedUser) {
            reject(`User with id ${id} not found`);
          } else {
            resolve(updatedUser); 
          }
        })
        .catch(err => {
         
          if (err.code === 11000) {
            reject("User name already taken"); 
          } else {
            reject(err.message);
          }
        });
    });
  };


  // Change user password
  module.exports.updateUserPassword = function (id, oldPassword, newPassword) {
    return new Promise((resolve, reject) => {
      if (!oldPassword || !newPassword) {
        return reject("Missing password fields");
      }
  
      User.findById(id)
        .exec()
        .then((user) => {
          if (!user) {
            return reject("User not found");
          }

          return bcrypt.compare(oldPassword, user.password).then((isMatch) => {
            if (!isMatch) {
              reject("Old password is incorrect");
            } else {
            
              return bcrypt
                .hash(newPassword, 10)
                .then((hashedNew) => {
                  user.password = hashedNew;
                  return user.save(); 
                })
                .then(() => {
                  resolve("Password updated successfully");
                });
            }
          });
        })
        .catch((err) => reject(err.message));
    });
  };



// Get the user comparsion list from database
module.exports.getComparsion = function(id){
    return new Promise(function(resolve, reject){

        User.findById(id)
            .exec()
            .then(user =>{
                resolve(user.comparsion)
            }).catch(err =>{
                reject(`Unable to get comparsion list for user id: ${id}`);
            });
    });
};

// Add the user's comparsion list into database 
module.exports.addComparsion = function(id, comparsionID){
    return new Promise(function (resolve, reject){
        User.findById(id).exec().then(user =>{
            if(user.comparsion.length < 5){
                User.findByIdAndUpdate(id,
                    {$addToSet:{comparsion: comparsionID}},
                    {new: true}
                ).exec()
                    .then(user => { resolve(user.comparsion); })
                    .catch(err =>{ reject(`Unable to update history for id: ${id}`)})
            }else{
                reject(`Unable to update comparsion list for id :${id}`);
            }  
        });
    });

};

// Remove the user's comparsion list into database 
module.exports.removeComparsion = function(id, comparsionID){
    return new Promise(function(resolve, reject){
        User.findByIdAndUpdate(id,
            {$pull: {comparsion: comparsionID}},
            {new: true}
        ).exec()
            .then(user =>{
                resolve(user.comparsion);
            }).catch(err =>{
                reject(`Unable to update comparsion list for id: ${id}`);
            });
    });
};

// Get the user's history list from database
module.exports.getHistory = function(id){
    return new Promise(function(resolve, reject){
        User.findById(id)
        .exec()
            .then(user =>{
                resolve(user.history)
            }).catch(err => {
                reject(`Unable to get histoty for id: ${id}`);
            });
    });
};

// Add the user's history list into database 
module.exports.addHistory = function(id, historyData ){
    return new Promise(function(resolve, reject){
        User.findById(id).exec().then(user =>{
            if(user.history.length < 20){
                User.findByIdAndUpdate(id,
                    {$addToSet: {history:historyData }},
                    {new: true}
            ).exec()
                .then(user =>
                    {resolve(user.history);}
                ).catch(err =>{
                    {reject(`Unable to update history for id: ${id}`)};
                }); 
            }else{
                reject(`User history has reached the maximum limit of 20.`);
            }
        });
    });
};

// Remove the user's comparsion list into database 
module.exports.removeHistory = function (id, historyData){
    return new Promise(function(resolve, reject){
        User.findByIdAndUpdate(id,
            {$pull: {history:historyData}},
            {new:true}
        ).exec()
            .then(user =>{
                resolve(user.history);
            }).catch(err =>{
                reject(`Unable to update history for id: ${id}`);
            });
    });
};
