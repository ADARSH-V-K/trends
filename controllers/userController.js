const User = require("../models/userModel");
const products = require("../models/products");
const cart = require("../models/cart");
const Order = require("../models/order")
const Coupon = require("../models/coupon")
const category = require("../models/category")
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const RandomString = require("randomstring");
const config = require("../config/config");
const { updateOne, findOne, count } = require("../models/userModel");
const {
    ChallengeContext,
} = require("twilio/lib/rest/verify/v2/service/entity/challenge");
const otpGenerator = require("otp-generator");
const coupon = require("../models/coupon");
const Razorpay = require('razorpay');
const { log, Console } = require("console");
const order = require("../models/order");
const banner = require('../models/banner')
const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
};
//for loading register page==============================================================

const loadRegister = async (req, res) => {
    try {
        res.render("registration");
    } catch (error) {
        res.render('404')
        console.log(error.message);
    }
};

var otp;
const sendVerifyOtpMail = async (name, email, user_id) => {
    try {
        otp = otpGenerator.generate(4, { digits: true, specialChars: false });
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword,
            },
        });
        console.log(config.emailPassword, config.emailUser);
        const mailOptions = {
            from: "avk57436@gmail.com",
            to: email,
            subject: "for verification using otp in mail",
            html: "<p>Hi " + name + ".This is your otp" + " " + otp + " <p>",
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("email has been sent-", info.response);
            }
        });
    } catch (error) {
        res.render('404')
        console.log(error.message);
    }
};

//for verifying mail================================================================================

//for loading login===================================================================================
const loadLogin = async (req, res) => {
    try {
        res.render("login");
    } catch (error) {
        res.render('404')
        console.log(error.message);
    }
};
//for inserting user using Otp===================================================================
const insertUserOtp = async (req, res) => {
    try {
        const checkMail = await User.findOne({ email: req.body.email });
        const CheckNumber = await User.findOne({ mobile: req.body.mobile });
        if (checkMail) {
            res.render("registration", { message: "mail id already exists" });
        } else if (CheckNumber) {
            res.render("registration", { message: "mobile number already exists" });
        } else {
            const password1 = await securePassword(req.body.password);
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                mobile: req.body.mobile,
                password: password1,
                isAdmin: 0,
            });
            const userData = await user.save();
            if (userData) {
                // const user_id = User.findById({ _id: userData });
                sendVerifyOtpMail(req.body.name, req.body.email, userData._id);
                res.render("otp", { userData });
            }
        }
    } catch (error) {
        {
            res.render("registration", { message: "Registration failed" });
        }
        console.log(error.message);
    }
};

//for sending otp
const otpPage = async (req, res) => {
    try {
        res.render("otp");
    } catch (error) {
        res.render('404')
        console.log(error.message);
    }
};

//for verifying otp login
const verifyOtp = async (req, res) => {
    try {
        if (otp === req.body.otpValue) {
            const updateInfo = await User.updateOne(
                { _id: req.body.user_id },
                { $set: { isVerified: 1 } }
            );
            // console.log(updateInfo);
            res.render("otp-verified");
        } else {
            res.redirect("/register");
        }
    } catch (error) {
        res.render('404')
        console.log(error.message);
    }
};

//for verifying login====================================================================

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email });
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (
                passwordMatch &&
                userData.isVerified == 1 &&
                userData.isBlock === 0
            ) {
                req.session.user_id = userData._id;
                res.redirect("/home");
            } else if (userData.isBlock === 1) {
                res.render("login", {
                    message: "your account is blocked.Please contact admin",
                });
            } else if (userData.isVerified === 0) {
                res.render("login", {
                    message: "your account is not verified.Please verify using mail",
                });
            } else {
                res.render("login", { message: "email and password is incorrect" });
            }
        } else {
            res.render("login", { message: "email and password is incorrect" });
        }
    } catch (error) {
        res.render('404')
        console.log(error.message);
    }
};

const getHome = async (req, res) => {
    try {

        if (req.session.user_id) {
            const userData = await User.findOne({ _id: req.session.user_id });
            const productData = await products.find({});
             const bannerData=await banner.find({})
            
            
            res.render("home", { productData,userData,bannerData});
            
        } else {
            
            const productData = await products.find({});
             const bannerData=await banner.find({})
            res.render("home", { productData,bannerData});
           
        }
    } catch (error) {
        console.log(error.message);
        res.render('404')
    }
};
const getShop = async (req, res) => {
    try {
       
        let Render  = false;
        if(req.query.isRender){
            Render=true;
        }

        let categoryId = req.query.categoryId || "";
        let sort = req.query.selectedValue || "";
        let search= req.query.search || "";
        let searchData = new String(search).trim()
      
   

        let query={} 

        if (search) {
            query["$or"] = [
                { name: { $regex:searchData, $options: "i" } },
                
            ];
        }

        if (categoryId) {
            query["$or"] = [
                { 
                    category: categoryId }
            ];
        }

        
        let sortQuery = { price: 1 }
        if (sort == 'high-to-low') {
            
            sortQuery = { price: -1 }
        }

        const limit = 8;
        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        
        const userData = req.session.user_id;
        const TotalProductData = await products.find(query);
        
        
        const categoryData=await category.find({}) 
        const productData = await products
            .find(query).sort(sortQuery)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
       
        if(Render == false) {
            
            res.render("shop4", {
                productData,
                categoryData,
                userData,
                totalPages: Math.ceil(TotalProductData.length / limit),
                currentPage: page
            });
        }else{
           
           res.json({
            productData,
            categoryData,
            userData,
            totalPages: Math.ceil(TotalProductData.length / limit),
            currentPage: page
           })
        }
       
        
       
    } catch (error) {
        console.log(error.message);
        res.render('404')
    }
};
const addCart = async (req, res) => {
    try {
        const sessionCheck = req.session.user_id;
        if (sessionCheck) {
            const userId = req.session.user_id;
            const productId = req.query.id;
            const data = await products.findOne({ _id: productId })
            let quantity = 1;
            let name = data.name;
            let price = data.price
            const cartCheck = await cart.findOne({ user: userId })

            if (cartCheck) {

                const Cart = await cart.findOne({ user: userId })

                const totalPrice = Cart.totalPrice + price
                let itemIndex = cartCheck.product.findIndex(p => p.productId == productId);
                if (itemIndex > -1) {
                    const updateResult = await cart.updateOne(
                        { user: userId, "product.productId": productId },
                        { $inc: { "product.$.quantity": quantity } },
                    );

                    const insert = await cart.updateOne({ user: userId }, { $set: { totalPrice: totalPrice } })
                    res.redirect('/getCart')
                } else {

                    const insert = await cart.updateOne({ user: userId }, { $push: { product: [{ productId, quantity, name, price }] } })
                    const insert2 = await cart.updateOne({ user: userId }, { $set: { totalPrice: totalPrice } })
                    res.redirect('/getCart')
                }
                // -----------------
            } else {
                const Cart = new cart({
                    product: [{ productId, quantity, name, price }],
                    totalPrice: price,
                    user: userId
                })
                
                const save = Cart.save();
                res.redirect('/getCart')
            }
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message);
        res.render('404')

    }
}
const minusCart = async (req, res) => {
    try {
        const sessionCheck = req.session.user_id;
        if (sessionCheck) {

            const userId = req.session.user_id;
            const productId = req.query.id;
            const data = await products.findOne({ _id: productId })
            let quantity = -1;
            let name = data.name;
            let price = data.price
            const cartCheck = await cart.findOne({ user: userId })
            if (cartCheck) {
                const Cart = await cart.findOne({ user: userId })

                const totalPrice = Cart.totalPrice - price


                let itemIndex = cartCheck.product.findIndex(p => p.productId == productId);
                if (itemIndex > -1) {
                    const updateResult = await cart.updateOne(
                        { user: userId, "product.productId": productId },
                        { $inc: { "product.$.quantity": quantity } },
                    );

                    const insert = await cart.updateOne({ user: userId }, { $set: { totalPrice: totalPrice } })
                    res.redirect('/getCart')
                } else {

                    const insert = await cart.updateOne({ user: userId }, { $push: { product: [{ productId, quantity, name, price }] } })
                    const insert2 = await cart.updateOne({ user: userId }, { $set: { totalPrice: totalPrice } })
                    res.redirect('/getCart')
                }

            } else {
                const Cart = new cart({
                    product: [{ productId, quantity, name, price }],
                    totalPrice: price,
                    user: userId
                })

                const save = Cart.save();
                res.redirect('/getCart')
            }
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message);
    
        res.render('404')
    }
}

const getCart = async (req, res) => {
    try {

        const userData = await User.findOne({ _id: req.session.user_id })

        if (userData) {

            const userCart = await cart.findOne({ user: req.session.user_id })
            let count = 0
            if (userCart) {
                const cartProducts = userCart.product

                const userCartProductsId = cartProducts.map(values => values.productId)
                const Products = await products.aggregate([
                    {
                        $match: {
                            _id: { $in: userCartProductsId }
                        }
                    }, {
                        $project: {
                            name: 1,
                            image: 1,
                            price: 1,
                            cartOrder: { $indexOfArray: [userCartProductsId, "$_id"] }
                        }
                    },
                    { $sort: { cartOrder: 1 } }
                ])
                count = products.length
                
                if (products.length > 0) {

                    res.render('cart', { Products, cartProducts, count,userCart })

                } else {
                    res.render('cart', { count, userData,userCart })
                }
            }

            else {
                res.render('cart', { Products, cartProducts, count,userCart })
        
            }
        }
        else {
         
            res.redirect('/login')
        } 
    } catch (error) {
        console.log('cart page error', error.message)
        res.render('404')

    }
}


///add to wishlist---------------------------------------------------------------------------
const addWishList = async (req, res) => {
    try {
        
        const userId = req.session.user_id;
       
        const productId = req.query.id;

        const data = await User.findOne({ _id: userId })
       
        let itemIndex = data.wishlist.findIndex(p => p.productId == productId);
        if (itemIndex === -1) {
            data.wishlist.push({ productId })
            const updatedUser = await data.save()
            res.redirect('/getWishList')
            
        }
        else {

            res.redirect('/login')
        }
    } catch (error) {
        res.render('404')
        console.log(error.message);
    }
}
///get Wishlist---------------------------------------------------------------------------
const getWishList = async (req, res) => {
    try {

        const userData = req.session.user_id
      
        const data = await User.findOne({ _id: userData }).populate('wishlist.productId')

        res.render('wishlist', { data })

    } catch (error) {
        res.render('404')
        console.log('cart page error', error.message)

    }
}

///////checkout==========================
const getCheckout = async (req, res) => {
    try {
        const id = req.session.user_id
        const userData=await User.findById({_id:id})
        
        const couponData= await Coupon.findOne({CouponCode:req.body.coupon})
        const cartChange = await cart.findOneAndUpdate({ user: id },{$set:{discountPrice:0}})
        const findCart = await cart.findOne({ user: id }).populate('product')
        const address=userData.Address
        res.render('checkout', { findCart ,couponData,userData,address})
       
    } catch (error) {
        res.render('404')
        console.log(error.message)
    }
}
//for Profile =================================================
const profilePage=async(req,res)=>{
    try {
        const user_id=req.session.user_id
        const userData=await User.findOne({_id:user_id})
       
        res.render('userProfile',{userData})
    } catch (error) {
        res.render('404')
        console.log(error.message)
    }
}
////for edit profile===============================================================
const editPage =async(req,res)=>{
    try {
      
        const user_id=req.session.user_id
        const userData=await User.find({_id:user_id})
        res.render('edit',{userData})
    } catch (error) {
        console.log(error.message)
        res.render('404')
        }
}
const saveEditPage =async(req,res)=>{
    try {
      
        const user_id=req.session.user_id
        const userData=await User.findByIdAndUpdate({_id:user_id},{$set:{name:req.body.name,mobile:req.body.mobile}})
         res.redirect('/getProfile')
    } catch (error) {
        console.log(error.message)
        res.render('404')
        }
}
//for  managing address 
const addressPage=async(req,res)=>{
    try {
               const id=req.session.user_id
        const userData=await User.findOne({_id:id})
       
        const address=userData.Address
                
        res.render('addressPage',{userData,address})
    } catch (error) {
        res.render('404')
        console.error(error.message);
    }
}

const addAddressPage=async(req,res)=>{
    try {
         res.render('addAddressPage')
    } catch (error) {
        res.render('404')
    }
}

const editAddressPage=async(req,res)=>{
    try {
       
     const addressId=req.query.id
    const userId=req.session.user_id
    const userData=await User.findById({_id:userId})
    const addressData =  userData.Address;
    const address =  addressData.find(item => item._id == req.query.id)
    
    
        
      
         res.render('editAddressPage',{userData,address})
       
    } catch (error) {
        res.render('404')
    }
}
const updateAddressPage=async(req,res)=>{
    try {
       


        const addressId = req.body.id
        const updated = await User.updateOne({ _id: req.session.user_id, 'Address._id': addressId },
            {
                $set: {
                    'Address.$.name': req.body.name,
                    'Address.$.address': req.body.address,
                    'Address.$.postcode': req.body.postcode,
                    'Address.$.city': req.body.city,
                    'Address.$.state': req.body.state,
                    'Address.$.country': req.body.country,
                    'Address.$.mobile': req.body.mobile,
                }
            })
        res.redirect('/manageAddress')


   
    } catch (error) {
        res.render('404')
        console.log("update Address section");
    }
}

const addAddressIn = async (req, res) => {
    try {
      const userId = req.session.user_id
      let Address ={
        name:req.body.name,
        address:req.body.address,
        postCode:req.body.postcode,
        city:req.body.city,
        mobile:req.body.mobile,
        country:req.body.country
      };
      const userData = await User.findByIdAndUpdate(
        { _id: userId },
        { $push: { Address: Address  } }
      )
      res.redirect('/manageAddress')
    } catch (error) {
      console.log(error.message);
      res.render('404')
    }
  };
//forgot password===============================================================
const loadForgot = async (req, res) => {
    try {
        res.render("forget");
        console.log(config.emailUser);
    } catch (error) {
        console.log(error.message);
        res.render('404')
    }
};

//sending reset password link to mail============================================================

const forgotVerify = async (req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({ email: email });
        if (userData) {
            if (userData.isVerified === 0) {
                res.render("forget", { message: "please verify your mail" });
            } else {
                const randomString = RandomString.generate();
                const updateData = await User.updateOne(
                    { email: email },
                    { $set: { token: randomString } }
                );
                sendResetPasswordMail(userData.name, userData.email, randomString);
                res.render("forget", {
                    message: "please check your mail to reset password",
                });
            }
        } else {
            res.render("forget", { message: "mail id is incorrect" });
        }
    } catch (error) {
        console.log(error.message);
        res.render('404')
    }
};
//for sending the link to mail============================================================================

const sendResetPasswordMail = async (name, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword,
            },
        });
        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: "for resetting password",
            html:
                "<p>Hi " +
                name +
                ' please click here to <a href="http://localhost:3000/forgot-password?token=' +
                token +
                '">reset </a>your password.</p>',
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("email has been sent-", info.response);
            }
        });
    } catch (error) {
        console.log(error.message);
        res.render('404')
    }
};

//for loading the page to enter new password====================================================================

const forgotPasswordLoad = async (req, res) => {
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({ token: token });
        if (tokenData) {
            res.render("newPassword", { user_id: tokenData._id });
        } else {
            res.render("404", { message: "token is invalid" });
        }
    } catch (error) {
        res.render('404')
        console.log(error.message);
    }
};
//for updating the password===============================================================

const resetPassword = async (req, res) => {
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;
        console.log(user_id);
        const secure_password = await securePassword(password);
        const updateData = await User.findByIdAndUpdate(
            { _id: user_id },
            { $set: { password: secure_password, token: "" } }
        );
        res.redirect("/login");
    } catch (error) {
        res.render('404')
        console.log(error.message);
    }
};
//for logout===========================================================================
const getLogout = async (req, res) => {
    try {
        req.session.user_id = "";
        res.redirect("/");
    } catch (error) {
        res.render('404')
        console.log(error.message);
    }
};
//for logout============================================================================
const remove = async (req, res) => {
    try {

        const id = req.query.id
        const productData = await products.findOne({ _id: id })
        const cartData = await cart.findOne({ user: req.session.user_id })
        const proIndex = cartData.product.findIndex((p) => p.productId == id)
        let qty = (cartData.product[proIndex].quantity)
        cartData.product.splice(proIndex, 1)


        cartData.totalPrice = cartData.totalPrice - productData.price * qty

        await cartData.save()
        res.redirect('/getCart')

    } catch (error) {
        res.render('404')
        console.log(error.message)
    }
}
const
    removeWishlist = async (req, res) => {
        try {

            const id = req.query.id

            const wishlistData = await User.findOne({ _id: req.session.user_id })

            const proIndex = await wishlistData.wishlist.findIndex((p) => p.productId == id)
            wishlistData.wishlist
                .splice(proIndex, 1)
            await wishlistData.save()
            res.redirect('/getWishList')

        } catch (error) {
            res.render('404')
            console.log(error.message)
        }
    }

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


//product page==============================================================
const productPage=async(req,res)=>{
    try {
        const id=req.query.id
        const productData=await products.findById({_id:id})
       
        res.render('productPage',{productData})
    } catch (error) {
        res.render('404')
        console.log(error.message)
    }
}
const detailsPage=async(req,res,next)=>{
    try {
        
        const id=req.query.id
        const orderData=await Order.findById({_id:id}).sort({
            createdAt:1}).populate('product.productId')
       
     
        
        res.render('detailsPage',{orderData}) 
    } catch (error) {
        res.render('404')
        console.log(error.message)
    }
}


const shirtPage= async (req, res) => {
    try {
        const id=req.query.id
        var search=""
        if(req.query.search){
            search=req.query.search
        }
        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        
      const ProductData=await products.find({category:id,
            $or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {description:{$regex:'.*'+search+'.*',$options:'i'}},
                
            ]
        })
        
        const limit = 8;
        const offset = (page - 1) * limit;
        const userData = req.session.user_id;
       
        
        const categoryData=await category.find({}) 
        const productData = await products
            .find({category:id,
                $or:[
                    {name:{$regex:'.*'+search+'.*',$options:'i'}},
                    {description:{$regex:'.*'+search+'.*',$options:'i'}},    
                ]
            })
            .limit(limit * 1).skip(offset > ProductData.length ? 0 : offset);
            
                
        res.render("shop4", {
            productData,
            categoryData,
            userData,
            totalPages: Math.ceil(ProductData.length / limit),
            currentPage: page
        });
       
    } catch (error) {
        console.log(error.message);
        res.render('404')
    }
};
const couponApply=async (req,res)=>{
    try {
       
       
      const user=req.session.user_id
   
      const couponData= await Coupon.findOne({CouponCode:req.body.code})
      const findCart=await cart.findOne({user:user})
    
     
   
      if (couponData) {
        const minimum= couponData.minPurchase
        if (findCart.totalPrice>minimum) {
          const couponType = couponData.discountType
          const discountAmount = couponData.discountAmount
          if (couponData.discountType === 'percentage') {
            discountPrice = findCart.totalPrice * (discountAmount/100);
          } else if (couponData.discountType === 'flat') {
            discountPrice = discountAmount;
          }
          const cartData = await cart.findOneAndUpdate(
            { user: user },
            { $set: { discountPrice : discountPrice } }
          );
          const updatedCart = await cart.findOne({ user: user });
          const jsonResponse = { message:'coupon applied',updatedCart:updatedCart,data:'applied' };
        
            res.json(jsonResponse)
  
        } else {
          const need =minimum-findCart.totalPrice
          const jsonResponse = { message:'you have to purchase rupees ' + need + 'more to avail this coupon',data:'minimumAmount' };
       
          res.json(jsonResponse)
        }
  
  
      } else {
       
        const jsonResponse = { message:'invalid coupon',data:'invalid'}
        res.json(jsonResponse)
      }
     
      
    }
    catch (error) {
        res.render('404')
        console.log(error.message);
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
        
        
        var instance = new Razorpay({key_id:'rzp_test_XuMLdJaiFzahLX', key_secret:'FryaTv9iDR7T3BvbNlpZyU9W'})
  
        var options = {
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
module.exports = {
    loadRegister,
    insertUserOtp,
    loadLogin,
    verifyLogin,
    getHome,
    loadForgot,
    forgotVerify,
    sendResetPasswordMail,
    forgotPasswordLoad,
    resetPassword,
    getLogout,
    otpPage,
    verifyOtp,
    getShop,
    addCart,
    minusCart,
    getCart,
    addWishList,
    getWishList,
    remove,
    getCheckout,
    removeWishlist,
    orderPlaced,
    orderPage,
    productPage,
    detailsPage,
    shirtPage ,
    couponApply,
    orderCreating,
    verifyPayment,
    profilePage,
    addressPage,
    editPage,
    saveEditPage,
    cancelOrder,
    returnOrder,
    addAddressPage,
    addAddressIn,
    editAddressPage,
    updateAddressPage,
    
};