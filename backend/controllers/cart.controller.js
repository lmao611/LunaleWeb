import Product from "../models/product.model.js";

// Lấy giỏ hàng
export const getCartProducts = async (req, res) => {
  try {
    // Lấy danh sách ID sản phẩm từ giỏ hàng
    const productIds = req.user.cartItems.map((item) => item.product);
    
    // Tìm thông tin chi tiết các sản phẩm đó
    const products = await Product.find({ _id: { $in: productIds } });

    // Ghép thông tin sản phẩm với số lượng & size trong giỏ hàng
    const cartItems = req.user.cartItems.map((cartItem) => {
      const product = products.find((p) => p._id.toString() === cartItem.product.toString());
      if (product) {
        return {
          ...product.toJSON(),
          quantity: cartItem.quantity,
          size: cartItem.size || "M", // Trả về size
          cartItemId: cartItem._id // ID riêng của item trong giỏ (để xóa chính xác nếu cần)
        };
      }
      return null;
    }).filter(item => item !== null); // Lọc bỏ sản phẩm null (nếu sp bị xóa khỏi DB)

    res.json(cartItems);
  } catch (error) {
    console.log("Error in getCartProducts ctrler", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Thêm vào giỏ hàng (Có xử lý Size)
export const addToCart = async (req, res) => {
  try {
    const { productId, size, quantity } = req.body; // Nhận thêm size và quantity
    const user = req.user;
    const qtyToAdd = quantity ? Number(quantity) : 1;
    const selectedSize = size || "M";

    // Tìm xem trong giỏ đã có sản phẩm này với SIZE này chưa
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

// Xóa khỏi giỏ (Cần sửa để xóa đúng item theo ID và Size, tạm thời xóa theo ProductID)
export const deleteAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!productId) {
      user.cartItems = [];
    } else {
      // Xóa tất cả các item có productId này (bất kể size)
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
    
    // Lưu ý: Logic này đang tìm item đầu tiên có productId. 
    // Nếu muốn chính xác hơn cần truyền cả size hoặc cartItemId lên.
    // Tạm thời giữ nguyên logic tìm theo ProductID để tương thích code cũ.
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