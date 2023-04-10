const products = require("../models/products");
const Coupon = require("../models/coupon")
const category = require("../models/category")
const Order = require("../models/order")
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




module.exports={
    productPage,
    getShop,
    detailsPage,
    couponApply
}