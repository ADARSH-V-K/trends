const User = require('../models/userModel')
const Product = require('../models/products')
const Category = require('../models/category')
const order = require('../models/order')
const Coupon = require('../models/coupon')
const bcrypt = require('bcrypt')
const { findById, findByIdAndUpdate, find, findOneAndUpdate } = require('../models/userModel')
const { name } = require('ejs')
const { set } = require('../routes/userRoute')
const coupon = require('../models/coupon')
const excelJS = require('exceljs')
const banner = require('../models/banner')
const loadAdminLogin = async (req, res) => {
    try {
        if (req.session.admin_id) {
            res.redirect('/adminHome')
        }
        else {
            res.render('loginAdmin')
        }

    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}


// //verify login
const verifyLogin = async (req, res) => {
    try {

        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email })
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch) {
                if (userData.isAdmin === 0) {
                    res.render('loginAdmin', { message: "email and password is incorrect" })
                } else {
                    req.session.admin_id = userData._id;

                    res.redirect('adminHome')

                }

            } else {
                res.render('loginAdmin', { message: "email and password is incorrect" })

            }

        } else {
            res.render('loginAdmin', { message: "email and password is incorrect" })

        }

    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }

}
const loadAdminHome = async (req, res) => {
    try {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const orderData = await order.find({}).populate('customer', 'product')
        const userData = await User.find({})
        console.log(userData);

        res.render('adminHome', { orderData, userData, options })
    } catch (error) {
        res.render('404')
        console.log(error.message)
    }
}

const LoadUser = async (req, res) => {
    try {
        const userData = await User.find({ isAdmin: 0 })
        if (req.session.admin_id) {
            res.render('UserManagement', { users: userData })
        }

    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}
const LoadLogout = async (req, res) => {
    try {
        req.session.admin_id = ""
        res.redirect('/admin')
    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}
const blockAndUnblockUser = async (req, res) => {
    try {
        const userId = req.query.id
        const userData = await User.findById({ _id: userId })
        if (userData.isBlock === 0) {
            const userData = await User.findByIdAndUpdate({ _id: userId }, { $set: { isBlock: 1 } })
            req.session.user_id = ''
            res.redirect('/admin/user')

        } else {
            const userData = await User.findByIdAndUpdate({ _id: userId }, { $set: { isBlock: 0 } })
            res.redirect('/admin/user')

        }
    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}
const getBanner = async (req, res) => {
    try {
        let page = 1
        if (req.query.page) {
            page = req.query.page
        }

        const bannerData = await banner.find({}).populate('category')

        res.render('bannerManagement', { bannerData })
      

    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}

const addBanner=async(req,res)=>{
    try {
        const bannerData=await banner.find({})
        
        const category = await Category.find({})
        res.render('addBanner',{category,bannerData})
        
    } catch (error) {
        res.render('errorPage')
    }
}

const insertBanner = async (req, res) => {
    try { 
        const Banner = await new banner({

            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            image: req.file.filename,
          
        })
        
        const bannerData = await Banner.save()
        if (bannerData) {

            res.redirect('/admin/banner')
        } else {
            res.render('addBanner', { message: 'image adding failed' })
        }

    } catch (error) {
    
        res.render('errorPage')
        console.log(error)
    }
}
const getProduct = async (req, res) => {
    try {
        var page = 1
        if (req.query.page) {
            page = req.query.page
        }
        const productData = await Product.find({}).populate('category')

        res.render('Product', { productData })

    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}
const addProduct = async (req, res) => {
    try {
        const category = await Category.find({})

        res.render('addProduct', { category })

    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}


// to insert product
const insertProduct = async (req, res) => {

    try {
        let files = []
        const imageUpload = await (function () {
            for (let i = 0; i < req.files.length; i++) {
                files[i] = req.files[i].filename
            }
            return files
        })()

        const product = new Product({

            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            image: imageUpload,
            stock: req.body.stock
        })
        const productData = await product.save()
        if (productData) {

            res.redirect('/admin/Product')
        } else {
            res.render('addProduct', { message: 'product adding failed' })
        }

    } catch (error) {
        res.render('errorPage')

        console.log(error)
    }
}
const loadCategory = async (req, res) => {
    try {
        const categoryData = await Category.find({})
        res.render('category', { categoryData })

    }
    catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}


const addCategory = async (req, res) => {
    try {

        res.render('addCategories')
    }

    catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}

const insertCategory = async (req, res) => {
    try {
        const name = req.body.name

        const cat = await Category.findOne({ name: name })

        if (cat) {
            return res.redirect('/admin/category')
        } else {
            const category = new Category({
                name: req.body.name
            })



            const categoryData = await category.save()
            if (categoryData) {
                return res.redirect('/admin/category')
            } else {
                return res.render('addCategories', { message: 'category adding failed' })
            }
        }
    }

    catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}

const updateCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const categoryData = await Category.findOne({ _id: id })
        res.render('updateCategory', { categoryData })

    }

    catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}
const updatedCategory = async (req, res) => {
    try {
        const id = req.body.id;
        console.log(id);
        const categoryData = await Category.findByIdAndUpdate({ _id: id }, { $set: { name: req.body.name } })
        res.redirect('/admin/category')
    }
    catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}
const deleteCategory = async (req, res) => {
    try {
        const id = req.query.id;

        const productData = await Product.find({ category: id })
        const categoryData = await Category.find({})
        if (productData.length > 0) {
            res.render('category', { categoryData, message: "you cannot delete this category since it contains products" })
        }
        else {
            const remove = await Category.findByIdAndDelete({ _id: id })
            res.redirect('/admin/category')
        }

    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}
const deleteItem = async (req, res) => {
    try {
        const id = req.query.id;
        const productData = await Product.findById({ _id: id })

        if (productData.stock === 0) {
            const remove = await Product.findByIdAndDelete({ _id: id })
            res.redirect('/admin/product')
        }
        else {
        
            res.redirect('/admin/product')
       
    }
           
        

    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}
const deleteBanner = async (req, res) => {
    try {
        const id = req.query.id;
        // const bannerData = await banner.findById({ _id: id })

                    const remove = await banner.findByIdAndDelete({ _id: id })
            res.redirect('/admin/banner')
            
    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}
const updateItem = async (req, res) => {
    try {
        const id = req.query.id;
        const categoryData = await Category.find({})
        const productData = await Product.findOne({ _id: id }).populate('category')
      
        res.render('update', { productData, categoryData })
    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}
const updateAddItem = async (req, res) => {
    try {
        let files = []
        const imageUpload = (function () {
            for (let i = 0; i < req.files.length; i++) {
                files[i] = req.files[i].filename
            }
            return files
        })()

        if (req.files.length > 0) {
            const productData = await Product.findByIdAndUpdate({ _id: req.query.id }, { $set: { name: req.body.name, description: req.body.description, price: req.body.price, stock: req.body.stock, category: req.body.category, image: imageUpload } })
            res.redirect('/admin/product')
        }
        else {
            const productData = await Product.findByIdAndUpdate({ _id: req.query.id }, { $set: { name: req.body.name, description: req.body.description, price: req.body.price, stock: req.body.stock, category: req.body.category } })
            res.redirect('/admin/product')
        }
    }
    catch (error) {
        res.render('errorPage')

        console.log(error.message);

    }
}
const orderManagement = async (req, res) => {
    try {
        const orderData = await order.find({}).populate('product.productId').sort({
            createdAt:-1})


        res.render('orderManagement', { orderData })
    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}
const viewOrderDetails = async (req, res) => {
    try {
        const id = req.query.id
        const orderData = await order.findById({ _id: id }).populate('product.productId').sort({
            createdAt:-1})
        const productData = orderData.product
        res.render('viewOrder', { orderData, productData })

    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}

const viewOrderUpdatedDetails = async (req, res) => {
    try {
        const id = req.body.id



    
        const orderData = await order.updateOne({ _id: id }, { $set: { paymentStatus: req.body.paymentStatus, orderStatus: req.body.orderStatus } }).populate('product.productId')
        const ordData=await order.findOne({_id:id})
        const userData=await User.findOne({_id:ordData.user})
        
        if(ordData.orderStatus=='Refund'){
            userData.wallet=userData.wallet+ordData.totalPrice
            userData.save()
        }
{
    
}
        res.redirect('/admin/getOrder')


    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}
const couponPage = async (req, res) => {
    try {
        const couponData = await Coupon.find({})
        res.render('Coupon', { couponData })
    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}
const addCouponPage = async (req, res) => {
    try {
        res.render('addCoupons')
    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}
const updateCouponPage = async (req, res) => {
    try {


        const coupon = new Coupon({
            CouponCode: req.body.CouponCode,
            discountType: req.body.discountType,
            discountAmount: req.body.discountAmount,
            maxDiscountAmount: req.body.maxDiscountAmount,
            minPurchase: req.body.minPurchase,
            expiryDate: req.body.expiryDate
        })
        const couponData = await coupon.save()
        if (couponData) {
            res.redirect('/admin/getCoupon')
        }

    } catch (error) {
        res.render('errorPage')

        console.log(error.message)
    }
}

const deleteCoupon = async (req, res) => {
    try {

        const id = req.query.id
        const remove = await coupon.findByIdAndDelete({ _id: id })
        res.redirect('/admin/getCoupon')

    } catch (error) {
        res.render('errorPage')

    }
}
const editCoupon=async(req,res)=>{
    try {
        const id=req.query.id
        const couponData=await coupon.findById({_id:id})
   
        res.render('editCoupon',{couponData})
    } catch (error) {
        res.render('errorPage')
    }
}
const  updatedCoupon =async(req,res)=>{
    try {
        const id=req.body.id

        const couponData=await coupon.findOneAndUpdate({_id:id},{$set:{ CouponCode: req.body.CouponCode,
            discountType: req.body.discountType,
            discountAmount: req.body.discountAmount,
            maxDiscountAmount: req.body.maxDiscountAmount,
            minPurchase: req.body.minPurchase}})
            res.redirect('/admin/getCoupon')
    } catch (error) {
        res.render('errorPage')
    }
}
const salesReport = async (req, res) => {
    try {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const start = req.body.start
        const end = req.body.end
        const orderData = await order.find({
            orderStatus: "Delivered",
            createdAt: { $gte: start, $lte: end }
        })


        res.json({ orderData, options })

    } catch (error) {
        console.log(error.message);
      res.render('errorPage')

    }
}


const exportSales = async (req, res) => {
    try {

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report')

        worksheet.columns = [

            { header: "Date", key: "createdDate" },
            { header: "Order Id", key: "id" },
            { header: "Coustemet", key: "customer" },
            { header: "Amount", key: "subTotal" },
            { header: "Payment Method", key: "paymentMethod" },
            { header: "Payment Status", key: "paymentStatus" },
            { header: "Order Status", key: "orderStatus" },

        ];

        const start = req.body.start;
        const end = req.body.end;
        const orderData = await order.find({
            orderStatus: "Delivered",
            createdAt: { $gte: start, $lte: end }
        })

        for (let i = 0; i < orderData.length; i++) {
            worksheet.addRow({
                createdDate: orderData[i].
                createdAt.toLocaleDateString(), id: orderData[i]._id,
                customer: orderData[i].customer.name,
                subTotal: orderData[i].totalPrice, paymentMethod: orderData[i].paymentMethod,
                paymentStatus: orderData[i].paymentStatus, orderStatus: orderData[i].orderStatus
            });
        }

        res.setHeader(
            "content-Type",
            "application/vnd.openxmlformates-officedocument.spreadsheatml.sheet"
        )

        res.setHeader('Content-Disposition', 'attachment; filename=sales.xlsx')

        return workbook.xlsx.write(res).then(() => {
            res.status(200);
        })
    } catch (error) {
        console.log(error.message);
        res.render('errorPage')

    }
}

module.exports = {
    loadAdminLogin,
    verifyLogin,
    LoadUser,
    LoadLogout,
    blockAndUnblockUser,
    getProduct,
    loadAdminHome,
    addProduct,
    insertProduct,
    loadCategory,
    addCategory,
    insertCategory,
    deleteCategory,
    deleteItem,
    updateItem,
    updateAddItem,
    updateCategory,
    updatedCategory,
    orderManagement,
    viewOrderDetails,
    viewOrderUpdatedDetails,
    couponPage,
    addCouponPage,
    updateCouponPage,
    deleteCoupon,
    editCoupon,
    updatedCoupon,
    salesReport,
    exportSales,
    addBanner,
    insertBanner,
    getBanner,
    deleteBanner

}