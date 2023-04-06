const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const category = require('./category');

const productSchema =new mongoose.Schema({
    name:{
        type: String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    price:{
        type:Number,
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
    stock:{
        type:Number,
    }
})
module.exports =  mongoose.model('Product',productSchema);
