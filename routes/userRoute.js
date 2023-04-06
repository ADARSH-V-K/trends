const express=require('express')
const user_route=express()
const bodyParser=require('body-parser');
const session=require('express-session')

user_route.use(bodyParser.json())
user_route.use(bodyParser.urlencoded({extended:true}))
const auth=require('../middleware/auth')
user_route.use(session({
    secret:'secretKey',
    saveUninitialized:true,
    resave:true
}));
user_route.set('view engine','ejs')
user_route.set('views','./views/users')

const userController=require("../controllers/userController")

user_route.get('/',userController.getHome)
user_route.get('/register',auth.isLogout,userController.loadRegister)
user_route.post('/register',userController.insertUserOtp)
user_route.get('/otp',userController.otpPage)
user_route.get('/login',auth.isLogout,userController.loadLogin)
user_route.get('/home',auth.isLogin,userController.getHome)
user_route.post('/login',userController.verifyLogin)
user_route.get('/password',auth.isLogout,userController.loadForgot)
user_route.post('/reset',auth.isLogout,userController.forgotVerify)
user_route.post('/forgot-password',auth.isLogout,userController.sendResetPasswordMail)
user_route.get('/forgot-password',userController.forgotPasswordLoad)
user_route.post('/newPassword',userController.resetPassword)
user_route.get('/userLogout',userController.getLogout)
user_route.post('/submit',auth.isLogout,userController.verifyOtp)
user_route.get('/shop',userController.getShop)
user_route.get('/addCart',auth.isLogin,userController.addCart)
user_route.get('/minusCart',auth.isLogin,userController.minusCart)
user_route.get('/getCart',auth.isLogin,userController.getCart)
user_route.get('/addWishList',auth.isLogin,userController.addWishList)
user_route.get('/getWishList',auth.isLogin,userController.getWishList)
user_route.get('/removeCart',auth.isLogin,userController.remove)
user_route.get('/removeWishlist',auth.isLogin,userController.removeWishlist)
user_route.get('/getCheckout',userController.getCheckout)
user_route.post('/orderPlaced',auth.isLogin,userController.orderCreating)
user_route.get('/orderSuccess',auth.isLogin,userController.orderPlaced)
user_route.get('/cancelOrder',auth.isLogin,userController.cancelOrder)
user_route.get('/returnOrder',auth.isLogin,userController.returnOrder)
user_route.post('/applyCoupon',auth.isLogin,userController.couponApply)
user_route.get('/myOrders',auth.isLogin,userController.orderPage)
user_route.post('/verify-payment',auth.isLogin,userController.verifyPayment)
user_route.get('/getProfile',auth.isLogin,userController.profilePage)
user_route.get('/userEdit',auth.isLogin,userController.editPage)
user_route.post('/userEdit',auth.isLogin,userController.saveEditPage)
user_route.get('/manageAddress',auth.isLogin,userController.addressPage)
user_route.get('/addAddress',auth.isLogin,userController.addAddressPage)
user_route.get('/editAddress',auth.isLogin,userController.editAddressPage)
user_route.post('/editAddress',auth.isLogin,userController.updateAddressPage)
user_route.post('/addAddress',auth.isLogin,userController.addAddressIn)
user_route.get('/showProduct',userController.productPage)
user_route.get('/getdetails',auth.isLogin,userController.detailsPage)
// user_route.get('/getShirt',auth.isLogin,userController.shirtPage)

module.exports=user_route