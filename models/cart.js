const { ObjectId } = require('mongodb');
const mongoose=require('mongoose');

const cartData= new mongoose.Schema({
    
    product:[{
        productId:ObjectId,
        quantity:Number,
        name:String,
        price:Number 
    }],
totalPrice:{
    type:Number,
    default:0,
},
    user:{
        type:ObjectId,
        ref:"User",
        required:true
    }  ,
    discountPrice:{
        type:Number
    }
})


module.exports=mongoose.model('Cart',cartData)