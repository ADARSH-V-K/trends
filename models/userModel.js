const { name } = require("ejs")
const { ObjectId } = require("mongodb")
const mongoose = require("mongoose")
mongoose.set('strictQuery', true)
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        
    },
    email:{
        type:String,
        required:true

    },
    mobile:{
        type:Number,
        
    },

    password:{
        type:String,
        required:true
    },
    isAdmin:{
        type:Number,
        required:true
    },
    isVerified:{
        type:Number,
        default:0
    },
    isBlock:{
        type:Number,
        default:0
    },
    token:{
        type:String,
        default:''
    },
    wishlist:[
        {
            productId:
            {
                type:ObjectId,
                ref:'Product',
                required:true
            }
    }
    ],
    Address:[
        {
            name:{
                type:String
            },
            address:{
                type:String
            },
            postCode:{
                type:String
            },
            city:{
                type:String
            },
            country:{
                type:String
            },
            mobile:{
                type:Number
            }
        }

    ],
    wallet:{
        type:Number,
        default:0
    }
})
module.exports=mongoose.model('User',userSchema)