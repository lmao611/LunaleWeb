import Product from "../models/product.model.js";


export const getCartProducts = async (req, res) => {
  try {

    const productIds = req.user.cartItems.map((item) => item.product);
    

    const products = await Product.find({ _id: { $in: productIds } });


    const cartItems = req.user.cartItems.map((cartItem) => {
      const product = products.find((p) => p._id.toString() === cartItem.product.toString());
      if (product) {
        return {
          ...product.toJSON(),
          quantity: cartItem.quantity,
          size: cartItem.size || "M",
          cartItemId: cartItem._id
        };
      }
      return null;
    }).filter(item => item !== null);

    res.json(cartItems);
  } catch (error) {
    console.log("Error in getCartProducts ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const addToCart = async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;
    const user = req.user;
    const qtyToAdd = quantity ? Number(quantity) : 1;
    const selectedSize = size || "M";


    const existingItem = user.cartItems.find(
      (item) => item.product.toString() === productId && item.size === selectedSize
    );

    if (existingItem) {
      existingItem.quantity += qtyToAdd;
    } else {
      user.cartItems.push({ 
          product: productId, 
          quantity: qtyToAdd, 
          size: selectedSize 
      });
    }

    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    console.log("Error in addToCart ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const deleteAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!productId) {
      user.cartItems = [];
    } else {

      user.cartItems = user.cartItems.filter((item) => item.product.toString() !== productId);
    }
    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    console.log("Error in deleteAllFromCart ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;
    

    const existingItem = user.cartItems.find((item) => item.product.toString() === productId);

    if (existingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter((item) => item.product.toString() !== productId);
        await user.save();
        return res.json(user.cartItems);
      }
      existingItem.quantity = quantity;
      await user.save();
      res.json(user.cartItems);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("Error in updateQuantity ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};