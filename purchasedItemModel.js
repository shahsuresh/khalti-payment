import mongoose from "mongoose";

// Define the schema for the purchased item
const purchasedItemSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    purchaserName: {
      type: String,
      required: false,
      default: "Suresh Shah",
    },
    paymentMethod: {
      type: String,
      enum: ["khalti"],
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "refunded"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Compile the schema into a model
const PurchasedItem = mongoose.model("PurchasedItem", purchasedItemSchema);

export default PurchasedItem;
