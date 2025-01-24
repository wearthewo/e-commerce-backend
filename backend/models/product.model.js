import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      reuired: true,
    },
    description: {
      type: String,
      reuired: [true, "Description is required"],
    },
    price: {
      type: Number,
      min: 0,
      required: true,
    },
    image: {
      type: String,
      reuired: [true, "Image is required"],
    },
    category: {
      type: String,
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
