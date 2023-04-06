const mongoose = require('mongoose');
const { Schema } = mongoose;

const CouponSchema = new Schema({
  CouponCode: { type: String,
          },
  discountType: { type: String,
                   enum: ['percentage', 'flat'],
                    },
  discountAmount: { type: Number, 
                    },
  maxDiscountAmount: { type: Number },
  minPurchase:{
    type:Number,
 
  },
  expiryDate: { type: Date,  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Coupon', CouponSchema);