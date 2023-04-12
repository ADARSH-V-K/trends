const User = require("../models/userModel");
const products = require("../models/products");
const cart = require("../models/cart");
const Coupon = require("../models/coupon")
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
let otp;
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

const addCart = async (req, res) => {
    try {
        const sessionCheck = req.session.user_id;
        if (sessionCheck) {
            const userId = req.session.user_id;
            const productId = req.query.id;
            const data = await products.findOne({ _id: productId })
            let quantity = 1;
            let name = data.name;
            let price = data.price;
            const cartCheck = await cart.findOne({ user: userId })
            let checkqty = quantity;
            if (req.query.qty) {
                checkqty = req.query.qty;
            }

            if (data.stock > checkqty) {
                if (cartCheck) {
                    const Cart = await cart.findOne({ user: userId });
                    const totalPrice = Cart.totalPrice + price;
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
                // Show the sweet alert when the product is out of stock
               
                res.redirect('/getCart?message=this+product+is+out+of+stock');

                
            }
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message);
        res.render('404')
    }
}


//original

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
            if(data.stock>0)
            {
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
        }else{
            res.render('404')
        } }else {
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
              let message=req.query.message
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

                    res.render('cart', { Products, cartProducts, count,userCart,message })

                } else {
                    res.render('cart', { count, userData,userCart,message })
                }
            }

            else {
                res.render('cart', {   count,userCart,message })
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
    addCart,
    minusCart,
    getCart,
    addWishList,
    getWishList,
    remove,
    getCheckout,
    removeWishlist,
  
};