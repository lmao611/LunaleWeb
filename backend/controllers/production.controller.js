import Production from "../models/production.model.js";

const defaultSizes = { total: 0, S: 0, M: 0, L: 0, XL: 0 };

export const getAllProductions = async (req, res) => {
  try {
    const productions = await Production.find({});
    res.status(200).json(productions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProduction = async (req, res) => {
  try {
    const { productId } = req.params;
    let production = await Production.findOne({ product: productId });
    
    if (!production) {
      production = {
        product: productId,
        inventory: [{
          tonDauKy: { ...defaultSizes },
          ngayNhap: "",
          nhapTrongKy: { ...defaultSizes },
          ngayXuat: "",
          xuatTrongKy: { ...defaultSizes },
          tonCuoiKy: { ...defaultSizes }
        }],
        batches: [{
          items: [
            { name: "Vải Chính", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
            { name: "Vải Lót", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
            { name: "Gọng", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
            { name: "Ép Keo", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
            { name: "Cắt", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
            { name: "Gia công", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 }
          ]
        }]
      };
    }
    res.status(200).json(production);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveProduction = async (req, res) => {
  try {
    const { productId } = req.params;
    const { inventory, batches } = req.body;

    const production = await Production.findOneAndUpdate(
      { product: productId },
      { inventory, batches },
      { new: true, upsert: true }
    );

    res.status(200).json(production);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};