import mongoose from "mongoose";
import CustomerOrder from "../models/customerOrder.model.js";
import Order from "../models/orders.model.js"; 
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js"; 
import Product from "../models/product.model.js"; 
import Counter from "../models/counter.model.js";
import { io, getReceiverSocketId, emitToAdmins } from "../lib/socket.js"; 
import { redis } from "../lib/redis.js";
import { getClientIp } from "../lib/requestIp.js";

const MAX_QTY = 99;

/** Giá bán thực tế: áp dụng % khuyến mãi giống frontend */
const computeSellingPrice = (product) => {
  const base = Number(product?.price) || 0;
  const percent = product?.isSale
    ? Math.min(Math.max(Number(product?.salePercentage) || 0, 0), 100)
    : 0;
  return Math.round(base * (1 - percent / 100));
};

const safeRedis = async (fn, fallback = null) => {
  try {
    return await fn();
  } catch (err) {
    console.error("[REDIS]", err.message);
    return fallback;
  }
};

/**
 * Sinh orderId tuần tự, nguyên tử.
 * Lần đầu chạy sẽ khởi tạo bộ đếm bằng orderId lớn nhất đang có
 * để không đụng số của các đơn cũ.
 */
const getNextOrderId = async () => {
  let counter = await Counter.findById("customerOrder").lean();

  if (!counter) {
    const last = await CustomerOrder.findOne().sort({ orderId: -1 }).select("orderId").lean();
    const start = Number(last?.orderId) || 0;
    try {
      await Counter.create({ _id: "customerOrder", seq: start });
    } catch {
      /* instance khác vừa tạo -> bỏ qua */
    }
  }

  const updated = await Counter.findByIdAndUpdate(
    "customerOrder",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();

  return updated.seq;
};

// === HÀM BẮN THÔNG BÁO CHO ADMIN & CONTROLLER ===
const notifyAdminsAboutOrder = async (order, customerName) => {
  try {
    const admins = await User.find({ role: { $in: ["admin", "controller"] } });
    
    if (!admins || admins.length === 0) return;

    const displayId = order.orderId ? `#LN${order.orderId.toString().padStart(4, '0')}` : `#${order._id.toString().slice(-6).toUpperCase()}`;
    
    const notifsToInsert = admins.map(admin => ({
        recipient: admin._id,
        message: `Có đơn hàng mới ${displayId} từ ${customerName}`,
        type: "order",
        relatedId: order._id
    }));
    
    if (notifsToInsert.length > 0) {
        const savedNotifs = await Notification.insertMany(notifsToInsert);
        
        admins.forEach((admin, idx) => {
            const receiverSocketId = getReceiverSocketId(admin._id.toString()); 
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newNotification", savedNotifs[idx]);
            }
        });
    }
  } catch (err) {
    console.error("Lỗi khi gửi thông báo cho admin:", err);
  }
};
// =================================================

export const createGuestOrder = async (req, res) => {
  try {
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (clientIp && typeof clientIp === 'string') {
      clientIp = clientIp.split(',')[0].trim();
    }

    const countKey = `guest_order_count:${clientIp}`;
    const lockedKey = `guest_order_locked:${clientIp}`;

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

    const product = await Product.findById(productId).select(
      "name price image isSale salePercentage"
    );
    
    if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    const qty = Math.min(Math.max(Number(quantity) || 1, 1), MAX_QTY);
    const unitPrice = computeSellingPrice(product);
    const totalAmount = unitPrice * qty;

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
            price: unitPrice,
            image: product.image
        }],
        totalAmount: totalAmount,
        status: "Pending",
        paymentMethod: "COD",
        isPaid: false,
        orderId: await getNextOrderId()
    });

    emitToAdmins("newCustomerOrder", newOrder);

    // GỌI HÀM THÔNG BÁO Ở ĐÂY
    await notifyAdminsAboutOrder(newOrder, customerName);

    const currentCount = await redis.incr(countKey);
    
    if (currentCount >= 5) {
       await redis.set(lockedKey, "true", "EX", 24 * 60 * 60); 
       await redis.del(countKey);
    } else if (currentCount === 1) {
       await redis.expire(countKey, 24 * 60 * 60);
    }

    res.status(201).json({ success: true, message: "Đặt hàng thành công", order: newOrder });
  } catch (error) {
    res.status(500).json({ message: "L?i server" });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { products, note, paymentMethod, isPaid } = req.body;
    const user = req.user;

    const method = paymentMethod ? String(paymentMethod).slice(0, 20) : "COD";
    // Khách chỉ được tự đánh dấu "đã thanh toán" với chuyển khoản (sau khi quét QR).
    // COD luôn là chưa thanh toán.
    const paidByCustomer = method === "Chuyển khoản" ? Boolean(isPaid) : false;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // ---- Giá LUÔN lấy từ database, không tin giá do client gửi lên ----
    const builtItems = [];
    for (const item of products) {
      const productId = item?.product || item?.productId || item?._id;
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) continue;

      const product = await Product.findById(productId).select(
        "name price image isSale salePercentage"
      );
      if (!product) continue;

      // Giá bán thực tế = giá gốc - % khuyến mãi (giống cách frontend hiển thị)
      const effectivePrice = computeSellingPrice(product);

      const qty = Math.min(Math.max(Number(item.quantity) || 1, 1), MAX_QTY);
      const size = String(item.size || "M").slice(0, 12);

      const existed = builtItems.find(
        (b) => b.product.toString() === product._id.toString() && b.size === size
      );

      if (existed) {
        existed.quantity = Math.min(existed.quantity + qty, MAX_QTY);
      } else {
        builtItems.push({
          product: product._id,
          name: product.name,
          image: product.image,
          size,
          quantity: qty,
          price: effectivePrice,
        });
      }
    }

    if (builtItems.length === 0) {
      return res.status(400).json({ message: "Không có sản phẩm hợp lệ trong đơn" });
    }

    const calculatedTotal = builtItems.reduce(
      (total, item) => total + Number(item.price) * Number(item.quantity),
      0
    );

    const existingOrder = await CustomerOrder.findOne({
      user: user._id,
      status: "Pending",
    });

    if (existingOrder) {
      builtItems.forEach((newProduct) => {
        const idx = existingOrder.products.findIndex(
          (p) =>
            p.product.toString() === newProduct.product.toString() &&
            p.size === newProduct.size
        );

        if (idx > -1) {
          existingOrder.products[idx].quantity = Math.min(
            existingOrder.products[idx].quantity + newProduct.quantity,
            MAX_QTY
          );
          existingOrder.products[idx].price = newProduct.price;
          existingOrder.products[idx].name = newProduct.name;
        } else {
          existingOrder.products.push(newProduct);
        }
      });

      existingOrder.totalAmount = existingOrder.products.reduce(
        (total, item) => total + Number(item.price) * Number(item.quantity),
        0
      );

      if (note) {
        existingOrder.note = existingOrder.note
          ? `${existingOrder.note} | ${String(note).slice(0, 500)}`
          : String(note).slice(0, 500);
      }

      if (paymentMethod) existingOrder.paymentMethod = method;
      if (paidByCustomer) existingOrder.isPaid = true;

      if (!existingOrder.orderId) existingOrder.orderId = await getNextOrderId();

      existingOrder.customerInfo = {
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        address: user.direction,
      };

      await existingOrder.save();

      if (req.body.isFromCart) {
        user.cartItems = [];
        await user.save();
      }

      emitToAdmins("newCustomerOrder", existingOrder);
      await notifyAdminsAboutOrder(existingOrder, user.name);

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
      products: builtItems,
      totalAmount: calculatedTotal,
      note: note ? String(note).slice(0, 500) : undefined,
      paymentMethod: method,
      isPaid: paidByCustomer,
      orderId: await getNextOrderId(),
    });

    if (req.body.isFromCart) {
      user.cartItems = [];
      await user.save();
    }

    emitToAdmins("newCustomerOrder", newOrder);

    await notifyAdminsAboutOrder(newOrder, user.name);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("[CREATE ORDER]", error.message);
    res.status(500).json({ message: "Lỗi tạo đơn hàng" });
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

    const ALLOWED_STATUS = ["Pending", "Processed", "Shipping", "Delivered", "Cancelled"];
    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

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
    res.status(500).json({ message: "Lỗi server" });
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
    res.status(500).json({ message: "Lỗi hủy đơn" });
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