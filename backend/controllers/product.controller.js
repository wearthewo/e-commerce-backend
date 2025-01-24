import { redis } from "../../mongo_db/redis.js";
import Product from "../models/product.model.js";
import cloudinary from "../mongo_db/cloud.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json({ products });
  } catch (error) {
    console.log("Error in fetching all products", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getPublicProducts = async (req, res) => {
  try {
    // check first in redis if you find return them from redis string to javascript value
    let publicProducts = await redis.get("public_products");
    if (publicProducts) {
      return res.json(JSON.parse(publicProducts));
    }
    // if not in redis look into mongodb
    // lean method returns javascript objects instead mongodb - better performance
    publicProducts = await Product.find({ isPublic: true }).lean();
    if (!publicProducts) {
      return res.status(404).json({ message: "No publoc products found" });
    }
    //if found store them in redis because they are freuently accessed by all users
    await redis.set("public_products", JSON.stringify(publicProducts));
    res.json(publicProducts);
  } catch (error) {
    console.log("Error in fetchin public products", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;
    let cloudinaryRes = null;
    if (image) {
      cloudinaryRes = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }
    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryRes?.secure_url ? cloudinaryRes.secure_url : "",
      category,
    });
    return res
      .status(201)
      .json(product)
      .json({ message: "Product created successfully!" });
  } catch (error) {
    console.log("Error creating product", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    //delete image from cloudinary
    if (product.image) {
      //secure_url: 'https://res.cloudinary.com/demo/image/upload/vtrue57true2true8330/cr4mxeqx5zb8rlakpfkg.jpg'
      const public_id = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.destroy(`products/${public_id}`);
        console.log("Image deleted from cloud");
      } catch (error) {
        console.log("Error deleting image from cloud", error);
      }
    }
    // Delete product from mongodb
    await Product.findByIdAndDelete(id);
    return res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error deleting product", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getTop3Products = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 3 },
      },
      {
        $project: {
          _id: true,
          bame: true,
          description: true,
          image: true,
          price: true,
        },
      },
    ]);
    return res.json(products);
  } catch (error) {
    console.log("Error retrieving top 3 products", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category });
    return res.json(products);
  } catch (error) {
    console.log("Error in fetching product by category", error.message);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (product) {
      product.isPublic = !product.isPublic;
      const updatedProduct = await product.save();
      if (updatedProduct.isPublic === true) {
        try {
          await redis.set("public_products", JSON.stringify(updateProduct));
          return res.json(updatedProduct);
        } catch (error) {
          console.log("Error in updating Redis");
        }
      } else {
        console.log("Product is not in Reddis");
      }
    } else {
      return res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("Error in updating product", error.message);
    res
      .status(500)
      .json({ message: "Inernal server error", error: error.message });
  }
};

export const getProductsSortedByPrice = async () => {
  try {
    const sortedProducts = await Product.aggregate([
      { $sort: { price: -1, price: 1 } }, // sort products by price descending and ascending respectively
    ]);
    return res.json(sortedProducts);
  } catch (error) {
    console.log("Error in sorting", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
