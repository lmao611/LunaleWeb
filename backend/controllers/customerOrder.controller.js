import CustomerOrder from "../models/customerOrder.model.js";
import Order from "../models/orders.model.js"; 
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js"; 
import Product from "../models/product.model.js"; 
import { io, getReceiverSocketId } from "../lib/socket.js"; 
import { redis } from "../lib/redis.js"; // IMPORT REDIS ĐỂ LƯU IP CẤM VĨNH VIỄN

export const createGuestOrder = async (req, res) => {
  try {
    // 1. Lấy IP chính xác của khách hàng
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (clientIp && typeof clientIp === 'string') {
      clientIp = clientIp.split(',')[0].trim();
    }

    const countKey = `guest_order_count:${clientIp}`;
    const lockedKey = `guest_order_locked:${clientIp}`;

    // 2. Kiểm tra IP này có đang bị cấm 24h không
    const isLocked = await redis.get(lockedKey);
    if (isLocked) {
       return res.status(429).json({ 
           message: "Bạn đã đạt giới hạn 5 đơn hàng vãng lai/ngày. Vui lòng đăng nhập để tiếp tục mua hàng hoặc thử lại sau 24h." 
       });
    }

    const { customerName, phone, address, productId, size, quantity } = req.body;

    if (!customerName || !phone || !address || !productId) {
        return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
    }

    const product = await Product.findById(productId);
    
    if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    const qty = Number(quantity) || 1;
    const totalAmount = product.price * qty;

    // Lấy orderId tiếp theo
    const lastOrder = await CustomerOrder.findOne().sort({ orderId: -1 });
    const nextOrderId = lastOrder && lastOrder.orderId ? lastOrder.orderId + 1 : 1;

    // 3. Tạo đơn hàng vãng lai
    const newOrder = await CustomerOrder.create({
        customerInfo: {
            name: customerName,
            phone: phone,
            address: address
        },
        products: [{
            product: product._id, 
            name: product.name,
            size: size || "M",
            quantity: qty,
            price: product.price,
            image: product.image
        }],
        totalAmount: totalAmount,
        status: "Pending",
        paymentMethod: "COD",
        isPaid: false,
        orderId: nextOrderId
    });

    // Phát sự kiện Socket cho Admin
    if (io) {
        io.emit("newCustomerOrder", newOrder);
    }

    // 4. TĂNG BỘ ĐẾM REDIS VÀ CẤM IP NẾU ĐẠT 5 ĐƠN
    const currentCount = await redis.incr(countKey);
    
    // Nếu vừa đặt đơn thứ 5 -> Khóa 24h (86400 giây) tính từ thời điểm này, và xóa bộ đếm
    if (currentCount >= 5) {
       await redis.set(lockedKey, "true", "EX", 24 * 60 * 60); 
       await redis.del(countKey);
    } else if (currentCount === 1) {
       // Set thời hạn 24h cho bộ đếm phòng trường hợp khách đặt 1 đơn rồi bỏ đi
       await redis.expire(countKey, 24 * 60 * 60);
    }

    res.status(201).json({ success: true, message: "Đặt hàng thành công", order: newOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- CÁC HÀM CŨ BÊN DƯỚI DÀNH CHO KHÁCH ĐÃ ĐĂNG NHẬP GIỮ NGUYÊN ---
export const createOrder = async (req, res) => {
  try {
    const { products, totalAmount, note, paymentMethod, isPaid } = req.body;
    const user = req.user;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    const lastOrder = await CustomerOrder.findOne().sort({ orderId: -1 });
    const nextOrderId = lastOrder && lastOrder.orderId ? lastOrder.orderId + 1 : 1;

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

      existingOrder.totalAmount = existingOrder.products.reduce((total, item) => {
        return total + (Number(item.price) * Number(item.quantity));
      }, 0);

      if (note) existingOrder.note = existingOrder.note ? `${existingOrder.note} | ${note}` : note;
      
      if (paymentMethod) existingOrder.paymentMethod = paymentMethod;
      if (isPaid !== undefined) existingOrder.isPaid = isPaid;

      if (!existingOrder.orderId) existingOrder.orderId = nextOrderId;

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

      io.emit("newCustomerOrder", existingOrder);

      return res.status(200).json(existingOrder);
    }

    const calculatedTotal = products.reduce((total, item) => {
        return total + (Number(item.price) * Number(item.quantity));
    }, 0);

    const newOrder = await CustomerOrder.create({
      user: user._id,
      customerInfo: {
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        address: user.direction,
      },
      products,
      totalAmount: calculatedTotal, 
      note,
      paymentMethod: paymentMethod || "COD",
      isPaid: isPaid || false,
      orderId: nextOrderId
    });

    if (req.body.isFromCart) {
        user.cartItems = [];
        await user.save();
    }

    io.emit("newCustomerOrder", newOrder);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Lỗi tạo đơn hàng", error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const myCustomerOrders = await CustomerOrder.find({ 
      user: userId,
      status: { $ne: "Processed" } 
    }).lean();

    const myAdminOrders = await Order.find({ customerId: userId })
      .populate("items.productId", "name image price") 
      .lean();

    const normalizedAdminOrders = myAdminOrders.map(order => ({
      _id: order._id,
      createdAt: order.createdAt,
      status: order.status,
      totalAmount: order.total,
      paymentMethod: order.paymentMethod,
      isPaid: order.status === "Processed", 
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

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const oldOrder = await CustomerOrder.findById(id);
    if (!oldOrder) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    const customerOrder = await CustomerOrder.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );

    try {
        if (status === "Processed" && oldOrder.status !== "Processed") {
            const orderItems = customerOrder.products.map(p => ({
                productId: p.product,
                size: p.size || "", 
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
                paymentMethod: customerOrder.paymentMethod || "COD", 
                createdBy: req.user ? req.user._id : null
            });

            try {
                const displayId = customerOrder.orderId 
                    ? `#LN${customerOrder.orderId.toString().padStart(4, '0')}` 
                    : `#${customerOrder._id.toString().slice(-6).toUpperCase()}`;

                const message = `Đơn hàng ${displayId} của bạn đã được xác nhận và đang được xử lý.`;
                
                const notification = await Notification.create({
                    recipient: customerOrder.user,
                    message: message,
                    type: "order", 
                    relatedId: customerOrder._id
                });

                const receiverSocketId = getReceiverSocketId(customerOrder.user);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newNotification", notification);
                }
            } catch (notifErr) {
                console.error("Lỗi gửi thông báo đơn hàng:", notifErr);
            }
        }
        else if (status === "Pending" && oldOrder.status === "Processed") {
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
      order.status = "đã hủy"; 
      await order.save();
      return res.json({ message: "Đã hủy đơn hàng", order });
    }

    return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Lỗi hủy đơn", error: error.message });
  }
};

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