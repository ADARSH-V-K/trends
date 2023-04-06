const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');


const orderSchema =new mongoose.Schema({
    createDate:{
        type:Date,
        
    },
    orderStatus:{
        type:String,
        default:"ordered"
    },
    paymentStatus:{
        type:String,
        default:"pending"
    },
    user:{
        type:ObjectId,
        ref:'User'
    },
    totalPrice:{
        type:Number
    },
    customer:{
        name:String,
        address:String,
        city:String,
        state:String,
        country:String,
        postCode:Number,
        phone:Number,
    },
    paymentMethod:{
        type:String,
        
    },
    product:[{
        productId:{
          type:ObjectId,
          ref:'Product'},
        quantity:Number,
        name:String,
        price:Number 
    }],

      
},{timestamps:true})
module.exports =  mongoose.model('Order',orderSchema);
