const express = require("express");
const  router = express.Router();
const mongoose = require("mongoose");

const Notifications = mongoose.model("Notification",{
    Title:{
        type:String,
        required:true
    },
    Message:{
        type:String,
        required:true
    },
    UserId:{
        type:String,
        required:true
    },
    Date:{
        type: Date,
        required: true,
        format: 'YYYY-MM-DD'
    }
})

// api to get notifications

router.get('/getNotifications/:userId', async (req, res) => {
    try{
        const userId = req.params.userId;
        let orders = await Notifications.find({UserId:userId});
        console.log("All Notifications Fetched");
        res.send(orders);
    }catch (error) {
        console.error('Error fetching Notifications:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// module.exports.Notifications = Notifications;
// module.exports = router;
module.exports = {
    router: router,
    Notifications
};