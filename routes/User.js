const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
// const {Orders} = require('./Orders');
const jwt = require("jsonwebtoken");
const middleware = require('./middleware');
const multer = require('multer');
const port = 4000;
// const bcrypt = require('bcrypt');

// CReating Schema for  User Details

const Users = mongoose.model('UsersData', {
    Name: {
        type: String,
        required: true
    },
    profileImage:{
        type :String,
        default:"http://localhost:4000/ProfilePic/default profile.png",
        required:false
    },
    Email: {
        type: String,
        unique:true,
        required: true

    },
    Phone: {
        type: Number,
        unique:true,
        required: true
    },
    OldPassword:{
        type:String,
        required:false
    },
    Password:{
        type:String,
        required:true
    },
    ConfirmPassword:{
        type:String,
        required:false
    },
    Address:{
        type:String,
        required:false
    },
    Role:{
        type:String,
        default:'User'
    },
    Status: {
        type: Boolean,
        default: true
    },
    Added: {
        type: Date,
        required: true,
        format: 'YYYY-MM-DD'
    }

});

const storage = multer.diskStorage({
    destination: './Upload/UserProfilepics',
    filename: (req, file, cb) => {
        return cb(null, file.originalname)
    }
})

const upload = multer({storage:storage})

//creating endpoint for profile pics
router.use('/ProfilePic',express.static("Upload/UserProfilepics"))

router.post("/uploadProfile", upload.single("ProfilePic"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
    res.json({
        sucess: 1,
        image_url: `http://localhost:${port}/ProfilePic/${req.file.filename}`
    })
})

//creating API for  adding user details to the database

router.post('/register', async (req, res) => {
    try {
        let allusers = await Users.find({});
        if (allusers.length > 0) {
            let last_users_array = allusers.slice(-1);
            let last_users = last_users_array[0];
            id = last_users.id + 1;
        } else {
            id = 1;
        }
        const {Name,profileImage,Email,Phone,Role,OldPassword,Password,ConfirmPassword,Address,Status} = req.body;
        // Check if the email already exists
        const existingUser = await Users.findOne({ Email: Email });

        if (existingUser) {
            // If user with the same email exists, respond with an error
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        if (Password !== ConfirmPassword){
            return res.status(400).json({success:false, message: "Passwords do not match"});
        }
        
        const newUser = new Users({
            id: id,
            Name,
            profileImage,
            Email,
            Phone,
            OldPassword,
            Password,
            ConfirmPassword,
            Address,
            Status,
            Role,
            Added: new Date()
        })
        await newUser.save();
        return res.status(201).json({ success: true, message: 'User registered successfully' });

    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//Creating API for  getting users from the database
router.post('/allUsers', async (req, res) => {
    const status = req.body.status;
    let users;
    if(status === "All"){
        users = await Users.find({}); 
    } else if(status === "Active"){
        users = await Users.find({Status:true});
        console.log(status, users)
    } else if(status === "Blocked"){
        users = await Users.find({Status:false});
        console.log(status, users)
    }
    console.log("All Users Fetched");
    res.send(users);
});

// Creating API for Retriving user Data from DataBase (Using Name Attribute)

router.get('/allUsers/:Name', async (req, res) => {
    const Name = req.params.Name;

    try {
        const user = await Users.findOne({ Name: Name });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`User ${Name} fetched`);
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});



//API for checking email and Password is correct or not.

// router.post('/logincheck', async (req, res) => {
//     const { Email, Password } = req.body;

//     try {
//         // Check if user with given email exists
//         const user = await Users.findOne({ Email });

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Check if the password matches
//         const passwordMatch = await bcrypt.compare(Password, user.Password);

//         if (!passwordMatch) {
//             return res.status(401).json({ message: 'Invalid password' });
//         }

//         console.log(`User ${Email} logged in`);
//         res.json({ message: 'Login successful' });
//     } catch (error) {
//         console.error('Error logging in:', error.message);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

//creating an API for Login endpoint

router.post("/login",async(req,res)=>{
    try{
        const {Email,Password} =  req.body;
        let exist = await Users.findOne({Email:Email});
        if (!exist){
            return res.status(400).send("User Not Found");
        }
        if (exist.Password !== Password){
            return res.status(400).send("Invalid Credentials");
        }
        let payload={
            user:{
                id:exist.id
            }
        }
        jwt.sign(payload,'secret_ecom',{expiresIn:'100m'},
        (err,token)=>{
            if(err) throw err;
            return res.json({ success: true, message: "Login successful", token, role:exist.Role, userId:exist._id });
        });
    }
    catch(err){
        console.log(err);
        return res.status(401).send("Server Error");
    }
});

// api for displaying profile

router.get('/Profile',middleware,async(req,res)=>{
    try{
        let exist = await Users.findById(req.user.id);
        if (!exist){
            return res.status(400).send("User Not Found");
        }
        res.json(exist);
    }
    catch(err){
        console.log(err);
        return res.status(500).send("Server Error");
    }
});
// updateing profile data using  put method 
router.put('/updateProfile', middleware, async (req, res) => {
    const userId = req.user.id; // Assuming you have userId stored in the token payload
    const updatedData = req.body; // Assuming the updated data is sent in the request body
    // const password = userId

    
    try {
        // Find the user by their ID
        const user = await Users.findById(userId);
        // console.log(user.Password);
        const OldPassword = updatedData.OldPassword;
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If Password field is present in updatedData, check if it matches the existing password
        if (OldPassword) {
            if (user.Password !== OldPassword) {
                return res.status(400).json({message:"The old password is incorrect."});
            }

            // Check if both Password and ConfirmPassword fields are present and match
            if (updatedData.Password !== updatedData.ConfirmPassword) {
                return res.status(400).json({message:"The new password and confirm password do not match."});
            }

            // Update Password and ConfirmPassword fields
            user.Password = updatedData.Password;
            user.ConfirmPassword = updatedData.ConfirmPassword;
        }

        // Update other profile data if present in updatedData
        user.Name = updatedData.Name || user.Name;
        user.Phone = updatedData.Phone || user.Phone;
        user.Email = updatedData.Email || user.Email;
        user.Address = updatedData.Address || user.Address;
        user.profileImage = updatedData.profileImage || user.profileImage;

        // Save updated user data
        await user.save();

        res.status(200).json({ message: 'User profile updated successfully', user });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// change use status
router.get('/userStatus/:userId',async(req,res)=>{
    try{
        const userId = req.params.userId;
        const user = await Users.findById({_id:userId})
        const response = await Users.updateOne({_id:userId},{Status:!user.Status});
        res.send({success: true, message: "Changed Status successful", response});
    }
    catch(err){
        console.log(err);
        return res.status(500).send("Server Error");
    }
});



module.exports = router;

module.exports.Users = Users;