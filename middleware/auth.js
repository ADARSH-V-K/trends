const express=require('express')
const User = require('../models/userModel')
const   isLogin=async(req,res,next)=>{
    try{
        // const UserD= await User.findById({_id:req.session.user_id})
        
        if(req.session.user_id ){     
            next()
        }else{
        //    req.session.destroy()
            res.redirect('/login')  
        }
    }catch(error){
        console.log(error.message)
    }
}
const isLogout=async(req,res,next)=>{
    try{
        if(req.session.user_id){
res.redirect('/home')
        }else{
            next()
        }
    }catch(error){
        console.log(error.message)
    }
}
module.exports={isLogin,isLogout}
