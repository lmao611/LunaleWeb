import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  tonDauKy: { type: Number, default: 0 },
  ngayNhap: { type: String, default: "" },
  nhapTrongKy: { type: Number, default: 0 },
  ngayXuat: { type: String, default: "" },
  xuatTrongKy: { type: Number, default: 0 },
  tonCuoiKy: { type: Number, default: 0 }
});

const batchItemSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  nguonNhap: { type: String, default: "" },
  ngayNhap: { type: String, default: "" },
  soLuong: { type: Number, default: 0 },
  gia: { type: Number, default: 0 }
});

const batchSchema = new mongoose.Schema({
  items: [batchItemSchema]
});

const productionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    unique: true
  },
  inventory: [inventorySchema],
  batches: [batchSchema]
}, { timestamps: true });

const Production = mongoose.model("Production", productionSchema);
export default Production;