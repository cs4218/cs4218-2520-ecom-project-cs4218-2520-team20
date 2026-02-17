import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    products: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Products",
      }],
      validate: {
        validator: v => v.length > 0,
        message: 'An order should have at least 1 product.'
      }
    },
    payment: {},
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    status: {
      type: String,
      default: "Not Processed",
      enum: ["Not Processed", "Processing", "Shipped", "Delivered", "Cancelled"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);