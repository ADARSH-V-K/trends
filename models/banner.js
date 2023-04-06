const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const category = require('./category');

const bannerSchema =new mongoose.Schema({
    name:{
        type: String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    category:{
       type:ObjectId,
       ref:'category',
       required:true
    },
    image:[{
        type:String,
    }],
 
})
module.exports =  mongoose.model('Banner',bannerSchema);
