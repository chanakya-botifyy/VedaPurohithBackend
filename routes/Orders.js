const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const middleware = require('./middleware');
const { Users } = require('./User');
const axios = require('axios');
const crypto = require('crypto');
const { type } = require("os");
const MID = 'M130S06O1KCA'
const salt_key = '419b9a36-f36e-427c-9303-13b27fda2922';
const { Notifications } = require('./Notifications');
// creating a schema for  product orders

const Orders = mongoose.model("orders", {
    id: {
        type: Number,
        required: true
    },
    Seva: {
        type: String,
        required: true
    },
    SevaImage: {
        type: String,
        required: true
    },
    Slot: {
        type: String,
        required: true
    },
    OrderDate: {
        type: Date,
        required: true,
        format: 'YYYY-MM-DD'
    },
    CustomerName: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    Phone: {
        type: String,
        required: true
    },
    Total: {
        type: Number,
        required: true
    },
    PaymentDate: {
        type: Date,
        required: true,
        format: 'YYYY-MM-DD'
    },
    Location: {
        type: String,
        required: true
    },
    BillingAddress: {
        type: String,
        required: true
    },
    Duration: {
        type: String,
        required: true
    },
    Category: {
        type: String,
        required: false
    },
    status: {
        type: String,
        default: "Upcoming",
        required: false
    },
    Purohith: {
        type: {
            _id: String,
            Name: String,
        },
        required: false
    },
    CustomerId: {
        type: String,
        required: false
    },
    TranscationId:{
        type:String,
        required:false
    }


})


// creating API for adding new order to the database

router.post('/addOrder', middleware, async (req, res) => {
    let allorders = await Orders.find({});
    let id;
    let exist = await Users.findById(req.user.id);
    if (allorders.length > 0) {
        let last_order_array = allorders.slice(-1);
        let last_order = last_order_array[0];
        id = last_order.id + 1;
    } else {
        id = 1;
    }
    const order_transation_id =   Date.now()
    const newOrder = new Orders({
        id: id,
        Seva: req.body.Seva,
        SevaImage: req.body.SevaImage,
        Slot: req.body.Slot,
        OrderDate: req.body.OrderDate,
        CustomerName: exist.Name,
        Email: exist.Email,
        Phone: exist.Phone,
        Total: req.body.Total,
        PaymentDate: new Date(),
        Location: req.body.Location,
        BillingAddress: req.body.BillingAddress,
        Duration: req.body.Duration,
        Category: req.body.Category,
        status: req.body.status,
        TranscationId:order_transation_id
    })
    console.log(newOrder);
    await newOrder.save();
    try {

        
        const data = {
            merchantId: MID,
            merchantTransactionId: order_transation_id,
            merchantUserId: 12,
            name: exist.Name,
            amount: req.body.Total*100,
            redirectUrl: `http://localhost:4000/paymentStatus/${order_transation_id}`,
            mobileNumber: exist.Phone,
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        }

        const payload = JSON.stringify(data)
        const payloadBuffer = Buffer.from(payload).toString('base64');
        const keyIndex = 1;
        const payString = payloadBuffer + '/pg/v1/pay' + salt_key
        const sha256 = crypto.createHash('sha256').update(payString).digest('hex');
        const checksum = sha256 + '###' + keyIndex

        const prodUrl = "https://api.phonepe.com/apis/hermes/pg/v1/pay"

        const options = {
            method: 'POST',
            url: prodUrl,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            data: {
                request: payloadBuffer
            }
        }

        axios.request(options).then(function (response) {
            console.log(response.data)
            console.log(response.data.data.instrumentResponse.redirectInfo.url)
            // return res.redirect(response.data.data.instrumentResponse.redirectInfo.url)
            res.json({
                sucess: true,
                Seva: req.body.Seva,
                Api_url:response.data.data.instrumentResponse.redirectInfo.url
            });
        })

    } catch (error) {
        console.log("fdsfds")
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
    console.log('Order added');
    
});

// creating API for Display All Orders  
// with filters on status options ['Upcoming', 'Deliverd', 'Cancelled']

router.post('/allOrders', async (req, res) => {
    const status = req.body.status
    let orders = await Orders.find({ status: status });
    console.log("All Orders Fetched");
    res.send(orders);
});

router.get('/orderDetails/:orderID', async (req, res) => {
    try {
        const orderID = req.params.orderID;
        let orders = await Orders.findById({ _id: orderID });
        console.log("All Orders Fetched");
        res.send(orders);
    } catch (error) {
        console.error('Error fetching Order Details:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/assignPurohiths/:orderID', async (req, res) => {
    try {
        const orderID = req.params.orderID;
        const Purohith = {
            _id: req.body.purohith._id,
            Name: req.body.purohith.Name
        };
        await Orders.updateOne({_id:orderID},{Purohith});
        const order = await Orders.findById({_id:orderID});
        // console.log(order);
        const newNotifications = new Notifications({
            UserId:req.body.purohith._id,
            Title:'New Order',
            Message:`Assigned you a ${order.Seva} seva in ${order.Location} area`,
            Date: new Date()
        });
        await newNotifications.save();
        console.log("assigned Purohith");
        res.send({ success: true });
    } catch (error) {
        console.error('Error assign Purohiths:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// api for displaying orders based on customer email id using token

router.get('/Orders', middleware, async (req, res) => {
    // Get the token from the cookies
    const token = req.header('x-token');

    // Check if the token exists
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        let exist = await Users.findById(req.user.id);

        // Query the database for orders associated with the email
        const userOrders = await Orders.find({ Email: exist.Email });
        // Send the order data as a response
        res.json(userOrders);
    } catch (error) {
        // If there's an error with token verification
        res.status(401).json({ message: 'Unauthorized' });
    }
});

// API for geting full customer details for admin page 

router.get('/customerDetails/:customerId', async (req, res) => {
    const customerId = req.params.customerId;

    try {
        const user = await Users.findById({ _id: customerId });
        const userOrders = await Orders.find({ Email: user.Email });
        console.log(userOrders)
        res.json({ success: true, user, userOrders });
    } catch (error) {
        console.error('Error fetching user:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/makePayment', async (req, res) => {
    try {

        const order_transation_id = "343443ABC1200"
        const data = {
            merchantId: MID,
            merchantTransactionId: order_transation_id,
            merchantUserId: 12,
            name: "Rao",
            amount: 200,
            redirectUrl: `http://localhost:3000/PaymentStatus/${order_transation_id}`,
            mobileNumber: 77745664555,
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        }

        const payload = JSON.stringify(data)
        const payloadBuffer = Buffer.from(payload).toString('base64');
        const keyIndex = 1;
        const payString = payloadBuffer + '/pg/v1/pay' + salt_key
        const sha256 = crypto.createHash('sha256').update(payString).digest('hex');
        const checksum = sha256 + '###' + keyIndex

        const prodUrl = "https://api.phonepe.com/apis/hermes/pg/v1/pay"

        const options = {
            method: 'POST',
            url: prodUrl,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            data: {
                request: payloadBuffer
            }
        }

        axios.request(options).then(function (response) {
            console.log(response.data)
            console.log(response.data.data.instrumentResponse.redirectInfo.url)
            return res.redirect(response.data.data.instrumentResponse.redirectInfo.url)
        })

    } catch (error) {
        console.log("fdsfds")
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/paymentStatus/:txnId', async (req, res) => {
    try {
        // console.log(res.req.body.merchantTransationId)
        const txnId = req.params.txnId;
        // const order_transation_id= res.req.body.merchantTransationId
        // const merchantId = res.req.body.merchantId

        const order_transation_id = txnId
        const merchantId = MID

        const keyIndex = 1;
        const payString = `/pg/v1/status/${merchantId}/${order_transation_id}` + salt_key
        const sha256 = crypto.createHash('sha256').update(payString).digest('hex');
        const checksum = sha256 + '###' + keyIndex

        const options = {
            method: 'GET',
            url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${order_transation_id}`,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': `${merchantId}`
            }
        }
        axios.request(options).then(function (response) {
            console.log(response.data)
            if (response.data.success === true) {
                console.log("HI, Success")
                // res.status(200).json({ success: true, message: 'Payment process completed' });
                return res.redirect(`http://localhost:3000/PaymentStatus/${order_transation_id}`)
            } else {
                console.log("HI, Fail")
                // res.status(200).json({ success: true, message: 'Payment Failed' });
                return res.redirect(`http://localhost:3000/PaymentStatus/${order_transation_id}`)
            }
        })
    } catch (error) {
        console.error('Error fetching Payment Details by Filter:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});



module.exports = {
    router: router,
    Orders: Orders
};

