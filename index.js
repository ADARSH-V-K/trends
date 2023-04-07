
const mongoose=require("mongoose")
mongoose.set('strictQuery', false);
// mongoose.connect("mongodb://127.0.0.1:27017/E_COMMERCE_WEBSITE_TRENDS")
mongoose.connect("mongodb+srv://adarsh:user@trends.nuj4lhe.mongodb.net/E_COMMERCE_WEBSITE_TRENDS?retryWrites=true&w=majority")
const express=require("express")
const path=require('path')
//client.logLevel = 'debug';
const app=express()
app.use(express.static(path.join(__dirname,'public')))
//cache control
app.use(function(req,res,next){
    res.set('cache-control','no-store')
    next()
})
// const morgan = require('morgan');
// app.use(morgan('dev'));

//error handling
const errorHandler = require('./errorHandler')

//for user route
const userRoute=require('./routes/userRoute')
app.use('/',userRoute)
// sendTextMsg()
//for admin route
const adminRoute=require('./routes/adminRoute')
app.use('/admin',adminRoute)

app.listen(3000,function(){
    console.log("server is running.")
})


