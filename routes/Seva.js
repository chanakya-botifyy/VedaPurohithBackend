const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require('multer');
const path = require("path");
const port = 4000;



// Image Storage Engine

const storage = multer.diskStorage({
    destination: './Upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({ storage: storage })

//creating upload Endpoint for images

router.use("/images", express.static("Upload/images"))

router.post("/uploadseva", upload.single("SevaData"), (req, res) => {
    res.json({
        success: 1,
        image_url: `https://king-prawn-app-r46w3.ondigitalocean.app/images/${req.file.filename}`
    })
})

// creating a schema for creating product

const SevaData = mongoose.model("sevadatas", {
    id: {
        type: Number,
        required: true
    },
    titleimage: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    items: {
        type: String,
        required: true
    },
    cost: {
        type: Number,
        required: true
    },
    gst:{
        type: Number,
        required: true
    },
    addedDate:{
        type: Date,
        required: true,
        format: 'YYYY-MM-DD'
    },
    Duration: {
        type: String,
        required: true
    }
})

// creating API for adding Puja

router.post('/addSeva', upload.any('titleimage'), async (req, res) => {
    let allpujaData = await SevaData.find({});
    let id;
    if (allpujaData.length > 0) {
        let last_pujaData_array = allpujaData.slice(-1);
        let last_pujaData = last_pujaData_array[0];
        id = last_pujaData.id + 1;
    } else {
        id = 1;
    }
    const pujaData = new SevaData({
        id: id,
        titleimage: `https://king-prawn-app-r46w3.ondigitalocean.app/images/${req.files[0].filename}`,
        title: req.body.title,
        category: req.body.category,
        description: req.body.description,
        items: `https://king-prawn-app-r46w3.ondigitalocean.app/images/${req.files[1].filename}`,
        cost: req.body.cost,
        gst:req.body.gst,
        addedDate:new Date(),
        Duration: req.body.Duration
    })
    await pujaData.save();
    console.log("Saved");
    res.json({
        sucess: true,
        title: req.body.title
    });
});

// api for updating seva

router.post('/updateSeva/:sevaId', upload.any('titleimage'), async (req, res) => {
    try{
        const sevaId = req.params.sevaId;
        let pujaData = {
            title: req.body.title,
            category: req.body.category,
            description: req.body.description,
            cost: req.body.cost,
            gst:req.body.gst,
            Duration: req.body.Duration
        }
        console.log(req.files)
        if(req.files.length && req.files[0].fieldname === 'titleimage'){
            pujaData = {...pujaData, titleimage: `https://king-prawn-app-r46w3.ondigitalocean.app/images/${req.files[0].filename}`}
            console.log('hi')
        }if(req.files.length > 1 && req.files[1].fieldname === 'items'){
                pujaData = {...pujaData, items: `https://king-prawn-app-r46w3.ondigitalocean.app/images/${req.files[1].filename}`}
            }
        if(req.files.length && req.files[0].fieldname === 'items'){
            pujaData = {...pujaData, items: `https://king-prawn-app-r46w3.ondigitalocean.app/images/${req.files[0].filename}`}
        }
        console.log(pujaData)
        const reponse = await SevaData.updateOne({_id:sevaId},pujaData);
        console.log("Updated");
        res.json({
            sucess: true,
            title: req.body.title,
            reponse
        });
    }catch (error) {
        console.error('Error updating seva Details:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Creating api for deleting Sevas

router.post('/removeSeva', async (req, res) => {
    try{
    await SevaData.findOneAndDelete({ _id: req.body.id });
    console.log("removed");
    res.json({
        sucess: true,
        title: req.body.title
    })
    }catch (error) {
        console.error('Error fetching Order Details:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
})

// Creating API for getting all Sevas

router.post('/allSevas', async (req, res) => {
    let pujaDatas
    if(req.body.category){
        const category = req.body.category
        pujaDatas = await SevaData.find({category:category});  
    }else{
        pujaDatas = await SevaData.find({});  
    }
    console.log("All Pujas Fetched");
    res.send(pujaDatas);
})

router.get('/allSevas', async (req, res) => {
    try {
        const pujaDatas = await SevaData.find({})
            .sort({ _id: -1 }) // Sort by ID in descending order
            .limit(3); // Limit the results to 3

        console.log("All Pujas Fetched");
        res.send(pujaDatas);
    } catch (error) {
        console.error("Error fetching pujas:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Creating API for Getting Data By Selecting Category

router.get('/allSevas/:category', async (req, res) => {
    try {
        const category = req.params.category;

        // Query the database to find SevaData documents matching the specified category
        const sevaByCategory = await SevaData.find({ category: category });

        console.log(`SevaData filtered by category '${category}' fetched`);
        res.json(sevaByCategory);
    } catch (error) {
        console.error('Error fetching SevaData by category:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//Creating API for Getting Data from selected ID

router.get('/sevaById/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // Query the database to find SevaData document with the specified id
        const seva = await SevaData.findById({_id:id});
        console.log(seva);

        if (!seva) {
            console.log(`SevaData with id '${id}' not found`);
            return res.status(404).json({ success: false, message: 'SevaData not found' });
        }

        console.log(`SevaData with id '${id}' fetched`);
        res.json(seva);
    } catch (error) {
        console.error('Error fetching SevaData by id:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/sevalistById/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // Query the database to find SevaData document with the specified id
        const seva = await SevaData.find({id:id});
        console.log(seva);

        if (!seva) {
            console.log(`SevaData with id '${id}' not found`);
            return res.status(404).json({ success: false, message: 'SevaData not found' });
        }

        console.log(`SevaData with id '${id}' fetched`);
        res.json(seva);
    } catch (error) {
        console.error('Error fetching SevaData by id:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


router.get('/sevalistById/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // Query the database to find SevaData document with the specified id
        const seva = await SevaData.find({id:id});
        console.log(seva);

        if (!seva) {
            console.log(`SevaData with id '${id}' not found`);
            return res.status(404).json({ success: false, message: 'SevaData not found' });
        }

        console.log(`SevaData with id '${id}' fetched`);
        res.json(seva);
    } catch (error) {
        console.error('Error fetching SevaData by id:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;