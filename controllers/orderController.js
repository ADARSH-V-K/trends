const Order = require("../models/order")
const cart = require("../models/cart");
const products = require("../models/products");
const order = require("../models/order")
const User=require("../models/userModel")
const Razorpay=require("razorpay")
const orderPlaced = async (req, res) => {
    try {
       
        res.render('order')
    } catch (message) {
        res.render('404')
        console.log(error.message)
    }
}
const orderPage = async (req, res) => {
    try {
        const User = req.session.user_id;
        
     orderData = await  Order.find({user:User}).populate('product.productId').sort({
        createdAt:-1})
     cartData=await cart.find({user:User})
     

        res.render('showOrder',{orderData,cartData})

    } catch (error) {
        res.render('404')
        console.log(error.message)
    }
} 

const cancelOrder = async (req,res)=>{
    try {
         const id = req.query.id;


   
        const ord = await order.findByIdAndUpdate({_id:id},{$set:{
            orderStatus:"Cancelled"}})
          if(ord.paymentMethod== 'Razor-Pay'){
            const userData=await User.findOne({_id:req.session.user_id})
             userData.wallet =userData.wallet+ord.totalPrice
             userData.save()
          }
           
            res.redirect('/myOrders')

    } catch (error) {
        console.log(error.message);
        res.render('404')
    }
}
const returnOrder = async (req,res)=>{
    try {
         const id = req.query.id;
        const ord = await order.findByIdAndUpdate({_id:id},{$set:{
            orderStatus:"Return Processing"}})
           
            res.redirect('/myOrders')

    } catch (error) {
        console.log(error.message);
        res.render('404')
    }
}

//for order creating-----------------------------------------------------------------------------------------
const orderCreating = async (req, res) => {
    try {
       
     
      const userId = req.session.user_id
      const cartData = await cart.findOne({user:userId}).populate('product')
      const productDetail = cartData.product
       
   
     
      const order = new Order({
        user: userId,
        product: productDetail,
        totalPrice: req.body.total,
        customer: {
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            postcode: req.body.postcode,
            phone: req.body.number,
            country: req.body.country,
            state: req.body.state,    
        },
        paymentMethod:req.body.paymentMethod,
        paymentStatus:'pending',
        status:'Placed'
      })
      const orderData = await order.save()

             if (req.body.paymentMethod ==='COD') {
            
        
       
        const orderData = await order.save()
        
        for (let i = 0; i < productDetail.length; i++) {
            let productOne = await products.findById({ _id: productDetail[i].productId })
            productOne.stock -= cartData.product[i].quantity
            productOne.save()
            
        }
        cartData.product = []
        cartData.totalPrice = 0
        const newCart = await cartData.save()
        let response= {status:true}
  
        res.json(response)
      } else if (req.body.paymentMethod  === 'Razor-Pay') {
        
        
        let instance = new Razorpay({key_id:'rzp_test_XuMLdJaiFzahLX', key_secret:'FryaTv9iDR7T3BvbNlpZyU9W'})
  
        let options = {
          amount: orderData.totalPrice*100,  // amount in the smallest currency unit
          currency: "INR",
          receipt: ''+orderData._id
        };
        instance.orders.create(options, function(err, orders) {
          
          if(err){
          console.log(err.message);
          }else{
           
            res.json({success:true,order:orders})
          } 
  
        });
      }
    } catch (error) {
        res.render('404')
      console.log(error.message);
    }
  }
  //payment verify
  const verifyPayment = async(req,res)=>{
    try {
        
       const orderId = req.body.order.receipt
        const crypto = require('crypto')
        const hmac = crypto.createHmac('sha256','FryaTv9iDR7T3BvbNlpZyU9W')
        .update(req.body.payment.razorpay_order_id+'|'+req.body.payment.razorpay_payment_id)
        .digest('hex')
       
        if(hmac == req.body.payment.razorpay_signature){
            const update = {$set:{
                paymentStatus: 'Charged'
            }}
            const options = {new: true}
            await Order.findByIdAndUpdate(orderId,update,options).then(()=>{
             const response={success:true}
                res.json(response)
            })
            
            
            const cartData = await cart.findOne({user:req.session.user_id}).populate('product')
            const productDetail = cartData.product
           
            for (let i = 0; i < productDetail.length; i++) {
                let productOne = await products.findById({ _id: productDetail[i].productId })
                productOne.stock -= cartData.product[i].quantity
                productOne.save()
                
            }
            cartData.product = []
            cartData.totalPrice = 0
            const newCart = await cartData.save()
        }
       else{
       const response = {paymentFailed:true}
        res.json(response)
       } 
       
    } catch (error) {
        res.render('404')
        console.log(error.message);
    }
  }
  module.exports={
    cancelOrder,
    returnOrder,
    orderCreating,
    verifyPayment,
    orderPlaced,
    orderPage
  }