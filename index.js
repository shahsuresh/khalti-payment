import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./connect.db.js";
import Item from "./itemModel.js";
import PurchasedItem from "./purchasedItemModel.js";
import { initializeKhaltiPayment, verifyKhaltiPayment } from "./khalti.js";
import Payment from "./paymentModel.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//?==============database Connection======================
connectDB();

//?=============add product/item to buy for testing=================
app.get("/add-product", async (req, res) => {
  await Item.create({
    name: "Milton Water Bottle",
    price: 250,
    inStock: true,
  });
  res.status(201).send({ message: "Item Added", success: true });
});

//?=== route to initilize khalti payment gateway========

app.post("/initialize-khalti", async (req, res) => {
  //try catch for error handling
  try {
    const { itemId, totalPrice, website_url } = req.body;
    // console.log(itemId, totalPrice, website_url);
    const itemData = await Item.findOne({
      _id: itemId,
      price: Number(totalPrice),
    });
    // console.log(itemData);
    if (!itemData) {
      return res.status(400).send({
        success: false,
        message: "item not found",
      });
    }
    // creating a purchase document to store purchase info in database
    const purchasedItemData = await PurchasedItem.create({
      item: itemId,
      paymentMethod: "khalti",
      totalPrice: totalPrice * 100,
    });

    const paymentInitate = await initializeKhaltiPayment({
      amount: totalPrice * 100, // amount should be in paisa (Rs * 100)
      purchase_order_id: purchasedItemData._id, // purchase_order_id because we need to verify it later
      purchase_order_name: itemData.name,
      return_url: `http://localhost:8080/complete-khalti-payment`, // it can be even managed from frontend
      website_url,
      customer_info: {
        name: "Suresh Shah",
        email: "suresh@khalti.com",
        phone: "9800000000",
      },
    });
    // console.log(paymentInitate);
    res.json({
      success: true,
      purchasedItemData: purchasedItemData,
      payment: paymentInitate,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      error,
    });
  }
});

//?==== it is our `return url` where we verify the payment done by user=====
app.get("/complete-khalti-payment", async (req, res) => {
  const {
    pidx,
    txnId,
    amount,
    mobile,
    purchase_order_id,
    purchase_order_name,
    transaction_id,
  } = req.query;

  try {
    const paymentInfo = await verifyKhaltiPayment(pidx);

    // Check if payment is completed and details match
    if (
      paymentInfo?.status !== "Completed" ||
      paymentInfo.transaction_id !== transaction_id ||
      Number(paymentInfo.total_amount) !== Number(amount)
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete information",
        paymentInfo,
      });
    }

    // Check if payment done in valid item
    const purchasedItemData = await PurchasedItem.find({
      _id: purchase_order_id,
      totalPrice: amount,
    });

    if (!purchasedItemData) {
      return res.status(400).send({
        success: false,
        message: "Purchased data not found",
      });
    }
    await PurchasedItem.findByIdAndUpdate(
      purchase_order_id,

      {
        $set: {
          status: "completed",
        },
      }
    );

    // Create a new payment record
    const paymentData = await Payment.create({
      pidx,
      transactionId: transaction_id,
      productId: purchase_order_id,
      amount,
      dataFromVerificationReq: paymentInfo,
      apiQueryFromUser: req.query,
      paymentGateway: "khalti",
      status: "success",
    });

    // Send success response
    res.json({
      success: true,
      message: "Payment Successful",
      paymentData,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error,
    });
  }
});

//?====================================================
// app.get("/create-item", async (req, res) => {
//   let itemData = await Item.create({
//     name: "Headphone",
//     price: 500,
//     inStock: true,
//     category: "vayo pardaina",
//   });
//   res.json({
//     success: true,
//     item: itemData,
//   });
// });
//?================port and server========================
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
