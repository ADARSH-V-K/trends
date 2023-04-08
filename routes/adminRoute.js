const express=require('express')
const admin_route=express()
 const session=require('express-session')
 admin_route.use(session({
    secret:'secretKey',
    saveUninitialized:true,
    resave:true
}));
const multer = require("multer");
const path = require("path");


admin_route.use(express.static("public"));


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname,'../public/trendimages'));
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name)
    }
});
const upload = multer({
    storage:storage
})
const bodyParser=require("body-parser");
const adminController=require('../controllers/adminController')
admin_route.use(bodyParser.json())
admin_route.use(bodyParser.urlencoded({extended:true}))
admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')
const auth=require("../middleware/adminAuth")

admin_route.get('/',auth.isLogout,adminController.loadAdminLogin)
admin_route.post('/',adminController.verifyLogin)
admin_route.get('/adminHome',auth.isLogin,adminController.loadAdminHome)
admin_route.get('/user',auth.isLogin,adminController.LoadUser)
admin_route.get('/logout',auth.isLogin,adminController.LoadLogout)
admin_route.get('/block-user',auth.isLogin,adminController.blockUser)
admin_route.get('/product',auth.isLogin,adminController.getProduct)
admin_route.get('/addProduct',auth.isLogin,adminController.addProduct)
admin_route.post('/addProduct',upload.array('image',10),adminController.insertProduct)
admin_route.get('/addBanner',auth.isLogin,adminController.addBanner)
admin_route.post('/addBanner',upload.single('image'),adminController.insertBanner)
admin_route.get('/banner',auth.isLogin,adminController.getBanner)
admin_route.get('/category',auth.isLogin,adminController.loadCategory)
admin_route.get('/addCategory',auth.isLogin,adminController.addCategory)
admin_route.post('/addCategory',adminController.insertCategory)
admin_route.get('/deleteCategory',auth.isLogin,adminController.deleteCategory)
admin_route.get('/updateCategory',auth.isLogin,adminController.updateCategory)
admin_route.post('/updatedCategory',auth.isLogin,adminController.updatedCategory)
admin_route.get('/deleteProduct',auth.isLogin,adminController.deleteItem)
admin_route.get('/deleteBanner',auth.isLogin,adminController.deleteBanner)
admin_route.get('/updateProduct',adminController.updateItem)
admin_route.post('/updateProduct',upload.array('image',10),adminController.updateAddItem)
admin_route.get('/getOrder',auth.isLogin,adminController.orderManagement)
admin_route.get('/viewDetails',auth.isLogin,adminController.viewOrderDetails)
admin_route.get('/getCoupon',adminController.couponPage)
admin_route.get('/addCoupons',adminController.addCouponPage)
admin_route.post('/addCoupons',adminController.updateCouponPage)
admin_route.get('/editCoupon',adminController.editCoupon)
admin_route.post('/editCoupon',adminController.updatedCoupon)
admin_route.get('/deleteCoupon',adminController.deleteCoupon)
admin_route.post('/viewDetails',auth.isLogin,adminController.viewOrderUpdatedDetails)
admin_route.post('/salesFilter',auth.isLogin,adminController.salesReport)
admin_route.post('/export-sales',auth.isLogin,adminController.exportSales)

module.exports=admin_route