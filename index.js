
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require('multer');
const path = require("path");
const cors = require("cors");
const { type } = require("os");
const { Z_DATA_ERROR } = require("zlib");
require ('dotenv').config();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

//Database Connection with MongoDB

mongoose.connect("mongodb+srv://satya:Satya123@cluster0.awsank5.mongodb.net/")

const UserRouter = require('./routes/User');
app.use('/',UserRouter);
const PurohithRouter = require('./routes/Purohith');
app.use('/',PurohithRouter);
const SevaRouter = require('./routes/Seva');
app.use('/',SevaRouter);
const Notifications = require('./routes/Notifications');
app.use('/',Notifications.router);
const OrdersRouter = require('./routes/Orders');
app.use('/',OrdersRouter.router);
const PaymentRouter = require('./routes/Payments');
app.use('/',PaymentRouter);



//API Creation

app.get("/", (req, res) => {
    res.send("Express App is Running")
})

app.listen(port, (error) => {
    if (!error) {
        console.log("Server Running on Port " + port);
    } else {
        console.log("Error :" + error)
    }
})







