const express = require("express");
const cors = require("cors");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios");
const bodyParser = require("body-parser");



// require("dotenv").config();



router.use(express.json());
router.use(express.urlencoded({
    extended: false
}));
router.use(cors());
router.use(bodyParser.urlencoded({
    extended: false
}));



let salt_key = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399'
let merchant_id = 'PGTESTPAYUAT'



router.post("/pay", async (req, res) => {

    try {
        const merchantTransactionId = 1234567890;
        const data = {
            merchantId: merchant_id,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: 102939399,
            name: "satya",
            amount: 100 * 100,
            redirectUrl: `http://localhost:8000/status/?id=${merchantTransactionId}`,
            redirectMode: 'POST',
            mobileNumber: 7569814157,
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        };
        const payload = JSON.stringify(data);
        const payloadMain = Buffer.from(payload).toString('base64');
        const keyIndex = 1;
        const string = payloadMain + '/pg/v1/pay' + salt_key;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + '###' + keyIndex;

        // const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"
        const prod_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay"

        const options = {
            method: 'POST',
            url: prod_URL,
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            data: {
                request: payloadMain
            }
        };

        // const response = await axios(options)

        // if(response){
        //     res.json(response.data)
        // }

        await axios(options).then(function (response) {
                console.log(response.data)

                return res.json(response.data)
            })
            .catch(function (error) {
                console.error(error);
            });

    } catch (error) {
        res.status(500).send({
            message: error.message,
            success: false
        })
    }

})


router.post("/status", async (req, res) => {

    const merchantTransactionId = req.query.id
    const merchantId = merchant_id

    const keyIndex = 1;
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + "###" + keyIndex;

    const options = {
        method: 'GET',
        url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': `${merchantId}`
        }
    };

    // CHECK PAYMENT TATUS
    axios.request(options).then(async (response) => {
            if (response.data.success === true) {
                const url = `http://localhost:5173/success`
                return res.redirect(url)
            } else {
                const url = `http://localhost:5173/failure`
                return res.redirect(url)
            }
        })
        .catch((error) => {
            console.error(error);
        });

})






// module.exports = router;



// importing modules


// creating express application

// UAT environment
// const MERCHANT_ID = "PGTESTPAYUAT";
// const PHONE_PE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
// const SALT_INDEX = 1;
// const SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
// const APP_BE_URL = "http://localhost:4000"; // our application

// // setting up middleware
// router.use(cors());
// router.use(bodyParser.json());
// router.use(
//   bodyParser.urlencoded({
//     extended: false,
//   })
// );



// // endpoint to initiate a payment
// router.get("/pay", async function (req, res, next) {
//   // Initiate a payment

//   // Transaction amount
//   const amount = 100;

//   // User ID is the ID of the user present in our application DB
//   let userId = "MUID123";

//   // Generate a unique merchant transaction ID for each transaction
//   let merchantTransactionId = uniqid();

//   // redirect url => phonePe will redirect the user to this url once payment is completed. It will be a GET request, since redirectMode is "REDIRECT"
//   let normalPayLoad = {
//     merchantId: MERCHANT_ID, //* PHONEPE_MERCHANT_ID . Unique for each account (private)
//     merchantTransactionId: merchantTransactionId,
//     merchantUserId: userId,
//     amount: amount * 100, // converting to paise
//     redirectUrl: `${APP_BE_URL}/payment/validate/${merchantTransactionId}`,
//     redirectMode: "REDIRECT",
//     mobileNumber: "9999999999",
//     paymentInstrument: {
//       type: "PAY_PAGE",
//     },
//   };

//   // make base64 encoded payload
//   let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
//   let base64EncodedPayload = bufferObj.toString("base64");

//   // X-VERIFY => SHA256(base64EncodedPayload + "/pg/v1/pay" + SALT_KEY) + ### + SALT_INDEX
//   let string = base64EncodedPayload + "/pg/v1/pay" + SALT_KEY;
//   let sha256_val = sha256(string);
//   let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

//   axios
//     .post(
//       `${PHONE_PE_HOST_URL}/pg/v1/pay`,
//       {
//         request: base64EncodedPayload,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "X-VERIFY": xVerifyChecksum,
//           accept: "application/json",
//         },
//       }
//     )
//     .then(function (response) {
//       console.log("response->", JSON.stringify(response.data));
//       res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
//     })
//     .catch(function (error) {
//       res.send(error);
//     });
// });

// // endpoint for initializing screen
// router.post()


// // endpoint to check the status of payment
// router.get("/payment/validate/:merchantTransactionId", async function (req, res) {
//   const { merchantTransactionId } = req.params;
//   // check the status of the payment using merchantTransactionId
//   if (merchantTransactionId) {
//     let statusUrl =
//       `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/` +
//       merchantTransactionId;

//     // generate X-VERIFY
//     let string =
//       `/pg/v1/status/${MERCHANT_ID}/` + merchantTransactionId + SALT_KEY;
//     let sha256_val = sha256(string);
//     let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

//     axios
//       .get(statusUrl, {
//         headers: {
//           "Content-Type": "application/json",
//           "X-VERIFY": xVerifyChecksum,
//           "X-MERCHANT-ID": merchantTransactionId,
//           accept: "application/json",
//         },
//       })
//       .then(function (response) {
//         console.log("response->", response.data);
//         if (response.data && response.data.code === "PAYMENT_SUCCESS") {
//           // redirect to FE payment success status page
//           res.send(response.data);
//         } else {
//           // redirect to FE payment failure / pending status page
//         }
//       })
//       .catch(function (error) {
//         // redirect to FE payment failure / pending status page
//         res.send(error);
//       });
//   } else {
//     res.send("Sorry!! Error");
//   }
// });


module.exports = router;