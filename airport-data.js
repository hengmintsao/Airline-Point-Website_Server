const mongoose = require('mongoose');




let Schema = mongoose.Schema;

let dataAirportSchema = new Schema({
    iata:{
        type: String,
        required: true,
        unique: true,
    },
    displayName:{
        type: String,
        required:true,
    }
})

module.exports = mongoose.model('Airport', dataAirportSchema);