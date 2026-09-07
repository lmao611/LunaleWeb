import mongoose from "mongoose";

const sizeSchema = {
  total: { type: Number, default: 0 },
  S: { type: Number, default: 0 },
  M: { type: Number, default: 0 },
  L: { type: Number, default: 0 },
  XL: { type: Number, default: 0 }
};

const inventorySchema = new mongoose.Schema({
  tonDauKy: sizeSchema,
  ngayNhap: { type: String, default: "" },
  nhapTrongKy: sizeSchema,
  ngayXuat: { type: String, default: "" },
  xuatTrongKy: sizeSchema,
  tonCuoiKy: sizeSchema
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
  inventory: { type: mongoose.Schema.Types.Mixed, default: [] },
  batches: { type: mongoose.Schema.Types.Mixed, default: [] },
  encryptedData: { type: String, default: null }
}, { timestamps: true });

const Production = mongoose.model("Production", productionSchema);
export default Production;