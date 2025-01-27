const mongoose = require('mongoose');

/* =============================================================History==============================================================================
1. Date: 2025-Jan-27 Description: For adding airport data to MongoDB(Finished) #TO-DO: 


=====================================================================================================================================================
*/


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