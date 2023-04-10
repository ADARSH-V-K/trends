const User = require("../models/userModel");



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
  const deleteAddress=async(req,res)=>{
    try {
        const addressId=req.query.id
        const userId=req.session.user_id
        const userData=await User.findById({_id:userId})
            const addressDelete=await User.updateOne({_id:userData},{$pull:{Address:{_id:addressId}}})
    res.redirect('/manageAddress')

        
    } catch (error) {
        console.log(error.message)
    }
  }
module.exports={
    profilePage,
    addAddressIn,
    addAddressPage,
    addressPage,
    editAddressPage,
    editPage,
    saveEditPage,
    updateAddressPage,
    deleteAddress
}