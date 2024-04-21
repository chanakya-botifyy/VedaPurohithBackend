const express = require("express");
const  router = express.Router();
const mongoose = require("mongoose");

const Payment = mongoose.model("Payments",{
    id: {
        type: Number,
        required: true
    },
    PurohithName: {
        type: String,
        required: true
    },
    Seva: {
        type: String,
        required: true
    },
    Amount: {
        type: Number,
        required: true
    },
    Status: {
        type: String,
        required: true
    },
    Date:{
        type:Date,
        require:true
    }
});

//Creating API for adding Payment Info

router.post("/add-payment",async(req,res)=>{
    let allpayments = await Payment.find({});
    let id;
    if (allpayments.length >0){
        let last_payment_array = allpayments.slice(-1);
        let last_payment = last_payment_array[0];
        id=last_payment.id+1;
    }else{
        id=1;
    }
    const payment = new Payment({
        id:id,
        PurohithName:req.body.PurohithName,
        Seva: req.body.Seva,
        Amount: req.body.Amount,
        Status: req.body.Status ? req.body.Status : "Pending",
        Date:new Date()
    });
    console.log(payment);
    await payment.save();
    console.log("payment details Saved");
    res.json({
        sucess:true,
        PurohithName:req.body.PurohithName
    })
});

// Creating API for Retriving Payment details from Datbase 
// optional filter Status

router.post('/allPayments',async(req,res)=>{
    try{
        const Status = req.body.Status;
        let allPayments;
        if(Status){
            allPayments = await Payment.find({Status:Status});
        }else{
            allPayments = await Payment.find({});
        }
        console.log("All payment Deatails Retrived");
        res.send(allPayments);
    }catch (error) {
        console.error('Error fetching Payment Details:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
})

//Creating API for Status of payment Based on Payment Pending and completed

router.get('/allPayments/:Status',async(req,res)=>{
    try{
        const Status = req.params.Status;

        const  filterData = await Payment.find({Status:Status});
        console.log("Filterd Data : ",filterData);
        res.json(filterData);
    }catch (error) {
        console.error('Error fetching Payment Details by Filter:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;