
const isLogin=async(req,res,next)=>{
    try{
        if(req.session.user_id){
            const userCart = await cart.findOne({ user: req.session.user_id })
            if(userCart.totalPrice>1000){
                
                userCart.totalPrice=userCart.totalPrice-.1*userCart.totalPrice
            }

        }else{
            res.redirect('/admin')
        }next()
    }catch(error){
        console.log(error.message)
    }
}