import CustomerOrder from "../models/customerOrder.model.js";
import Order from "../models/orders.model.js"; 
import User from "../models/user.model.js";

// 1. TẠO ĐƠN HÀNG
export const createOrder = async (req, res) => {
  try {
    const { products, totalAmount, note } = req.body;
    const user = req.user;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    const existingOrder = await CustomerOrder.findOne({
      user: user._id,
      status: "Pending",
    });

    if (existingOrder) {
      products.forEach((newProduct) => {
        const existingItemIndex = existingOrder.products.findIndex(
          (p) =>
            p.product.toString() === newProduct.product.toString() &&
            p.size === newProduct.size
        );

        if (existingItemIndex > -1) {
          existingOrder.products[existingItemIndex].quantity += newProduct.quantity;
        } else {
          existingOrder.products.push(newProduct);
        }
      });

      existingOrder.totalAmount += totalAmount;
      if (note) existingOrder.note = existingOrder.note ? `${existingOrder.note} | ${note}` : note;
      existingOrder.customerInfo = {
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        address: user.direction,
      };
      existingOrder.createdAt = Date.now();

      await existingOrder.save();

      if (req.body.isFromCart) {
        user.cartItems = [];
        await user.save();
      }

      return res.status(200).json(existingOrder);
    }

    const newOrder = await CustomerOrder.create({
      user: user._id,
      customerInfo: {
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        address: user.direction,
      },
      products,
      totalAmount,
      note,
    });

    if (req.body.isFromCart) {
        user.cartItems = [];
        await user.save();
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Lỗi tạo đơn hàng", error: error.message });
  }
};

// 2. LẤY ĐƠN CỦA TÔI (Đã ẩn đơn Processed)
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    // A. Lấy đơn khách tự đặt (TRỪ Processed để tránh hiện 2 lần)
    const myCustomerOrders = await CustomerOrder.find({ 
      user: userId,
      status: { $ne: "Processed" } 
    }).lean();

    // B. Lấy đơn Admin quản lý
    const myAdminOrders = await Order.find({ customerId: userId })
      .populate("items.productId", "name image price") 
      .lean();

    // C. Chuẩn hóa
    const normalizedAdminOrders = myAdminOrders.map(order => ({
      _id: order._id,
      createdAt: order.createdAt,
      status: order.status,
      totalAmount: order.total,
      paymentMethod: order.paymentMethod,
      customerInfo: {
        address: order.address,
        phone: order.phone,
        name: order.customerName
      },
      products: order.items.map(item => ({
        product: item.productId?._id,
        name: item.productId?.name || "Sản phẩm đã xóa",
        image: item.productId?.image || "/placeholder.png",
        price: item.price || 0,
        quantity: item.quantity,
        size: item.size
      })),
      type: 'admin_created'
    }));

    const allOrders = [...myCustomerOrders, ...normalizedAdminOrders].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(allOrders);
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ message: "Lỗi tải lịch sử đơn hàng" });
  }
};

// 3. XÁC NHẬN & HOÀN TÁC (Đã fix lỗi 500)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const oldOrder = await CustomerOrder.findById(id);
    if (!oldOrder) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    // 1. Cập nhật trạng thái trước
    const customerOrder = await CustomerOrder.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );

    // 2. Xử lý Logic Đồng bộ
    try {
        // --- CASE 1: XÁC NHẬN ĐƠN (Tạo bên Orders) ---
        if (status === "Processed" && oldOrder.status !== "Processed") {
            const orderItems = customerOrder.products.map(p => ({
                productId: p.product,
                size: p.size || "", // Fallback nếu không có size
                quantity: p.quantity,
                price: p.price
            }));

            await Order.create({
                customerId: customerOrder.user,
                customerName: customerOrder.customerInfo.name,
                address: customerOrder.customerInfo.address,
                phone: customerOrder.customerInfo.phone,
                items: orderItems,
                total: customerOrder.totalAmount,
                status: "chưa giao",
                receivedDate: null,
                deliverDate: null,
                paymentMethod: "COD",
                createdBy: req.user ? req.user._id : null
            });
        }

        // --- CASE 2: HOÀN TÁC (Xóa bên Orders) ---
        else if (status === "Pending" && oldOrder.status === "Processed") {
            // Tìm đơn Admin mới nhất của khách này khớp số tiền và trạng thái "chưa giao"
            await Order.findOneAndDelete(
                {
                    customerId: customerOrder.user,
                    total: customerOrder.totalAmount,
                    status: "chưa giao" 
                }, 
                { sort: { createdAt: -1 } }
            );
        }
    } catch (syncError) {
        // Nếu tạo/xóa đơn Admin lỗi -> Hoàn tác lại trạng thái CustomerOrder để không bị lệch data
        console.error("Sync error:", syncError);
        await CustomerOrder.findByIdAndUpdate(id, { status: oldOrder.status });
        return res.status(500).json({ message: "Lỗi đồng bộ đơn hàng (Đã hoàn tác)", error: syncError.message });
    }

    res.json(customerOrder);
  } catch (error) {
    console.error("Lỗi update status:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 4. HỦY ĐƠN
export const cancelMyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    let order = await CustomerOrder.findOne({ _id: id, user: userId });
    
    if (order) {
      if (order.status !== "Pending") {
        return res.status(400).json({ message: "Không thể hủy đơn đã xác nhận" });
      }
      order.status = "Cancelled";
      await order.save();
      return res.json({ message: "Đã hủy đơn hàng", order });
    }

    order = await Order.findOne({ _id: id, customerId: userId });
    
    if (order) {
      if (order.status !== "chưa giao") {
        return res.status(400).json({ message: "Không thể hủy đơn hàng đã giao" });
      }
      order.status = "đã hủy"; // Đảm bảo khớp enum bên Order
      await order.save();
      return res.json({ message: "Đã hủy đơn hàng", order });
    }

    return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Lỗi hủy đơn", error: error.message });
  }
};

// 5. UPDATE ADDRESS
export const updateOrderAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.body;
    const userId = req.user._id;

    let order = await CustomerOrder.findOne({ _id: id, user: userId });
    if (order) {
       if (order.status !== "Pending") return res.status(400).json({ message: "Không được sửa đơn đã xác nhận" });
       order.customerInfo.address = address;
       await order.save();
       return res.json({ message: "Cập nhật thành công", order });
    }

    order = await Order.findOne({ _id: id, customerId: userId });
    if (order) {
       if (order.status !== "chưa giao") return res.status(400).json({ message: "Không được sửa đơn đã giao" });
       order.address = address;
       await order.save();
       return res.json({ message: "Cập nhật thành công", order });
    }
    return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật địa chỉ" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await CustomerOrder.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách" });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    await CustomerOrder.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa đơn hàng" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa đơn hàng" });
  }
};