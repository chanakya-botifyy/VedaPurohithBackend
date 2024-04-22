const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require('multer');
const { type } = require("os");
const jwt = require("jsonwebtoken");
const path = require("path");
const port = 4000;

// Creating Schema for Purohith Details
const PurohithDetails = mongoose.model('PurohitDetail', {
    id: {
        type: Number,
        required: true
    },
    Name: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true,

    },
    Phone: {
        type: Number,
        required: true
    },
    Address: {
        type: String,
        required: true
    },
    DateofBirth: {
        type: Date,
        required: true
    },
    Location: {
        type: String,
        required: false
    },
    Languages: {
        type: String,
        required: false
    },
    PanNumber: {
        type: String,
        required: true
    },
    AadharNumber: {
        type: Number,
        required: true
    },
    DetailsFile: {
        type: String,
        required: false
    },
    Experience: {
        type: String,
        required: true
    },
    AccountNumber: {
        type: Number,
        required: true
    },
    IfscCode: {
        type: String,
        required: true
    },
    BankName: {
        type: String,
        required: true
    },
    Password:{
        type : String ,
        required:true
    },
    ConfirmPassword:{
        type : String ,
        required:true
    },
    Role:{
        type:String,
        default:"Purohith",
        required:true
    },
    Status: {
        type: String,
        default: "New",
        required: true
    },
    Added: {
        type: Date,
        required: true,
        format: 'YYYY-MM-DD'
    }
});

//Image Storage Engine

const storage = multer.diskStorage({
    destination: './Upload/PurohithData/Certificates',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({ storage: storage })

//Creating upload Endpoint for  Certificate Image
// router.use('/Certificates', express.static("Upload/PurohithData/Certificates"))

// router.post("/uploadcertificates", upload.single("Certificate"), (req, res) => {
//     res.json({
//         sucess: 1,
//         image_url: `http://localhost:${port}/Certificates/${req.file.filename}`
//     })
// })


//Creating upload Endpoint for  Details pdf

router.use('/Details', express.static("/Upload/PurohithData/Certificates"))

router.post("/uploaddetails", upload.single("Details"), (req, res) => {
    res.json({
        sucess: 1,
        image_url: `https://king-prawn-app-r46w3.ondigitalocean.app/Details/${req.file.filename}`
    })
})

// Creating API for  adding Purohith details to the database 
router.post('/addPurohithDetails', async (req, res) => {
    try {
        // Check if the email already exists
        const existingPurohith = await PurohithDetails.findOne({ Email: req.body.Email });
        const {Name,Email,Phone,Address,DateofBirth,Location,Languages,PanNumber,AadharNumber,DetailsFile,Experience,AccountNumber,IfscCode,BankName,Role,Password,ConfirmPassword,Status} = req.body;


        if (existingPurohith) {
            // If user with the same email exists, respond with an error
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        if (Password !== ConfirmPassword){
            return res.status(400).json({success:false, message: "Passwords do not match"});
        }
        let allPurohith = await PurohithDetails.find({});
        let id;
        if (allPurohith.length > 0) {
            let last_Purohith_array = allPurohith.slice(-1);
            let last_Purohith = last_Purohith_array[0];
            id = last_Purohith.id + 1;
        } else {
            id = 1;
        }
        const newPurohith = new PurohithDetails({
            id: id,
            Name: Name,
            Email: Email,
            Phone: Phone,
            Address: Address,
            DateofBirth: DateofBirth,
            Location: Location,
            Languages: Languages,
            PanNumber: PanNumber,
            AadharNumber: AadharNumber,
            DetailsFile: DetailsFile,
            Experience: Experience,
            AccountNumber: AccountNumber,
            IfscCode: IfscCode,
            BankName: BankName,
            Password:Password,
            ConfirmPassword:ConfirmPassword,
            Status: Status,
            Role:Role,
            Added: new Date()
        })
        console.log(newPurohith);
        await newPurohith.save();
        console.log('Purohith data saved');
        res.json({
            sucess: true,
            message: "Data added successfully",
            Name: req.body.Name + " is added"
        })
    } catch (error) {
        console.error('Error adding Purohith:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// creating API for Getting All Purohit Details from Database

router.post('/allPurohiths', async (req, res) => {
    const Status = req.body.Status;
    let allPurohits
    if (Status) {
        allPurohits = await PurohithDetails.find({ Status });
    } else {
        allPurohits = await PurohithDetails.find({});
    }
    console.log("All Purohiths Fetched");
    res.send(allPurohits);
})

// Creating API for Getting Purohith details like in Admin Table

router.post('/Purohiths', async (req, res) => {
    try {
        const selectedFields = {
            Name: 1,
            Email: 1,
            Phone: 1,
            DateofBirth: 1,
            Experience: 1,
            Added: 1,
            Location: 1
        }

        const Location = req.body.Location;
        const Status = req.body.Status;
        let FieldsSelected
        if(Location){
            FieldsSelected = await PurohithDetails.find({Location},selectedFields);
        }
        else if(Status){
            FieldsSelected = await PurohithDetails.find({Status},selectedFields);
        }
        else{
            FieldsSelected = await PurohithDetails.find({},selectedFields);
        }

        console.log("Purohiths Fetched");
        res.send(FieldsSelected);
    } catch (error) {
        console.error('Error fetching selected Fields:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// API for getting details by id

router.get('/PurohithDetails/:purohithId', async (req, res) => {
    try {
        const purohithId = req.params.purohithId;
        const FieldsSelected = await PurohithDetails.findById({ _id: purohithId });
        console.log("Purohith Fetched");
        res.send(FieldsSelected);
    } catch (error) {
        console.error('Error fetching Purohith Details:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Purohith Locations

router.get('/PurohithLocations', async (req, res) => {
    try {
        const LocationsList = await PurohithDetails.distinct("Location");
        console.log("Purohith Fetched");
        res.send(LocationsList);
    } catch (error) {
        console.error('Error fetching Locations List:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// purohit Status
router.post('/purohitStatus/:purohitId', async (req, res) => {
    try {
        const purohitId = req.params.purohitId;
        const Status = req.body.Status;
        console.log(Status);
        const response = await PurohithDetails.updateOne({ _id: purohitId }, { Status: 'New' });
        res.send({ success: true, message: "Changed Status successful", response });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send("Server Error");
    }
});

//Endpoint to login purohith
router.post('/PurohithLogin', async (req, res) => {
    try {
        const { Email, Password } = req.body;
        const exist = await PurohithDetails.findOne({ Email: Email }); // Using findOne instead of find

        if (!exist) {
            return res.status(400).send("Purohith not found");
        }

        if (exist.Status === "New") {
            return res.status(400).send("Admin has not approved your application");
        }
        if (exist.Status === "Blocked") {
            return res.status(400).send("Admin has Blocked your Login");
        }

        if (exist.Password !== Password) {
            return res.status(400).send("Incorrect password");
        }
        let payload={
            purohith:{
                id:exist.id
            }
        }
        jwt.sign(payload,'secret_ecom',{expiresIn:'100m'},
        (err,token)=>{
            if(err) throw err;
            return res.json({ success: true, message: "Purohith logged in successfully", token, role:exist.Role, userId:exist._id });
        });

        // return res.json({ success: true, message: "Purohith logged in successfully" });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send("Server Error");
    }
});



//Updating porith status to Accept or Reject



// // Your route handler
// router.post("/updateStatus/:id", async (req, res) => {
//     try {
//         const id = mongoose.Types.ObjectId(req.params.id);
//         id = req.params.id;
//         const status = req.body.Status.toLowerCase(); // Convert to lowercase for case insensitivity

//         // Validate if the status is "accept" or "reject"
//         if (status === "accept" || status === "reject") {
//             // Update the document
//             const updatedDocument = await PurohithDetails.findByIdAndUpdate(id, { Status: status }, { new: true });

//             if (!updatedDocument) {
//                 return res.status(404).json({ success: false, message: "Document not found" });
//             }

//             return res.json({ success: true, updatedDocument });
//         } else {
//             // If the status is neither "accept" nor "reject", don't update
//             return res.status(400).json({ success: false, message: "Invalid status value. Status should be 'accept' or 'reject'." });
//         }
//     } catch (error) {
//         console.error("Error updating status:", error);
//         return res.status(500).json({ success: false, message: "Internal server error" });
//     }
// });

module.exports = router;