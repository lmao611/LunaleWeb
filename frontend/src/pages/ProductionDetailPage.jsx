import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProductStore } from "../stores/useProductStore";
import { useProductionStore } from "../stores/useProductionStore";
import { ArrowLeft, Plus, Save } from "lucide-react";

const ProductionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchProductById } = useProductStore();
  const { fetchProduction, saveProduction } = useProductionStore();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [inventory, setInventory] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const productData = await fetchProductById(id);
      if (productData) {
        setProduct(productData);
        const prodData = await fetchProduction(id);
        if (prodData) {
          setInventory(prodData.inventory || []);
          setBatches(prodData.batches || []);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id, fetchProductById, fetchProduction]);

  const calculateInventory = (currentData) => {
    let newData = [...currentData];
    for (let i = 0; i < newData.length; i++) {
      let tonDau = i === 0 ? Number(newData[i].tonDauKy) || 0 : Number(newData[i - 1].tonCuoiKy) || 0;
      let nhap = Number(newData[i].nhapTrongKy) || 0;
      let xuat = Number(newData[i].xuatTrongKy) || 0;
      newData[i].tonCuoiKy = tonDau + nhap - xuat;
    }
    return newData;
  };

  const handleInventoryChange = (index, field, value) => {
    const newData = [...inventory];
    newData[index][field] = value;
    setInventory(calculateInventory(newData));
  };

  const addInventoryRow = () => {
    setInventory(prev => [
      ...prev,
      { tonDauKy: 0, ngayNhap: "", nhapTrongKy: 0, ngayXuat: "", xuatTrongKy: 0, tonCuoiKy: 0 }
    ]);
  };

  const handleBatchItemChange = (batchIndex, itemIndex, field, value) => {
    const newBatches = [...batches];
    newBatches[batchIndex].items[itemIndex][field] = value;
    setBatches(newBatches);
  };

  const addBatch = () => {
    setBatches(prev => [
      ...prev,
      {
        items: [
          { name: "Vải Chính", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
          { name: "Vải Lót", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
          { name: "Gọng", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
          { name: "Ép Keo", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
          { name: "Cắt", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 },
          { name: "Gia công", nguonNhap: "", ngayNhap: "", soLuong: 0, gia: 0 }
        ]
      }
    ]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveProduction(id, { inventory, batches });
    setIsSaving(false);
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) return <div className="min-h-screen bg-black text-teal-400 p-8 pt-24 text-center">Đang tải...</div>;
  if (!product) return <div className="min-h-screen bg-black text-teal-400 p-8 pt-24 text-center">Không tìm thấy sản phẩm</div>;

  const getProductName = () => {
    if (!product.name) return "SẢN PHẨM";
    return product.name.split(" ")[0].toUpperCase();
  };

  return (
    <div className="min-h-screen bg-black text-teal-400 p-4 pt-24 text-sm font-mono pb-20">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate("/admin/production")}
            className="flex items-center text-teal-500 hover:text-teal-300 transition-colors"
          >
            <ArrowLeft className="mr-2" size={20} />
            Quay lại
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-md font-bold transition-colors disabled:opacity-50 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
          >
            <Save className="mr-2" size={20} />
            {isSaving ? "ĐANG LƯU..." : "LƯU THAY ĐỔI"}
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center uppercase tracking-widest text-emerald-400">
          CHI TIẾT SẢN XUẤT - {product.name}
        </h1>

        <div className="flex flex-col xl:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-56 border border-teal-600 bg-gray-900 flex flex-col items-center justify-center p-4 rounded-md shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                <span className="font-bold text-center uppercase mb-3 text-emerald-300 tracking-wider">ẢNH {getProductName()}</span>
                <img 
                  src={product.image || product.thumbnail} 
                  alt={product.name}
                  className="w-full object-contain rounded border border-teal-800"
                />
              </div>

              <div className="flex-1 overflow-x-auto rounded-md border border-teal-600 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                <table className="w-full border-collapse text-center min-w-[600px] bg-gray-900">
                  <thead>
                    <tr>
                      <th className="border border-teal-700 p-3 bg-teal-900/60 text-emerald-300 w-24">TỒN ĐẦU KỲ</th>
                      <th className="border border-teal-700 p-3 bg-emerald-900/50 text-emerald-300 w-32">NGÀY NHẬP</th>
                      <th className="border border-teal-700 p-3 bg-emerald-900/50 text-emerald-300 w-32">NHẬP TRONG KỲ</th>
                      <th className="border border-teal-700 p-3 bg-cyan-900/50 text-emerald-300 w-32">NGÀY XUẤT</th>
                      <th className="border border-teal-700 p-3 bg-cyan-900/50 text-emerald-300 w-32">XUẤT TRONG KỲ</th>
                      <th className="border border-teal-700 p-3 bg-teal-900/60 text-emerald-300 w-32">TỒN CUỐI KỲ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-800 transition-colors">
                        <td className="border border-teal-700 p-0">
                          {index === 0 ? (
                            <input 
                              type="number" 
                              value={row.tonDauKy} 
                              onChange={(e) => handleInventoryChange(index, "tonDauKy", e.target.value)}
                              className="w-full h-full text-center bg-transparent outline-none font-bold text-yellow-400 py-3"
                            />
                          ) : null}
                        </td>
                        <td className="border border-teal-700 p-0">
                          <input 
                            type="date" 
                            value={row.ngayNhap || ""} 
                            onChange={(e) => handleInventoryChange(index, "ngayNhap", e.target.value)}
                            className="w-full h-full text-center bg-transparent outline-none text-teal-200 py-3 [color-scheme:dark]"
                          />
                        </td>
                        <td className="border border-teal-700 p-0">
                          <input 
                            type="number" 
                            value={row.nhapTrongKy || ""} 
                            onChange={(e) => handleInventoryChange(index, "nhapTrongKy", e.target.value)}
                            className="w-full h-full text-center bg-transparent outline-none text-teal-200 py-3"
                          />
                        </td>
                        <td className="border border-teal-700 p-0">
                          <input 
                            type="date" 
                            value={row.ngayXuat || ""} 
                            onChange={(e) => handleInventoryChange(index, "ngayXuat", e.target.value)}
                            className="w-full h-full text-center bg-transparent outline-none text-teal-200 py-3 [color-scheme:dark]"
                          />
                        </td>
                        <td className="border border-teal-700 p-0">
                          <input 
                            type="number" 
                            value={row.xuatTrongKy || ""} 
                            onChange={(e) => handleInventoryChange(index, "xuatTrongKy", e.target.value)}
                            className="w-full h-full text-center bg-transparent outline-none text-teal-200 py-3"
                          />
                        </td>
                        <td className="border border-teal-700 p-3 font-bold text-emerald-400 bg-gray-900">
                          {row.tonCuoiKy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-gray-900 p-2 border-t border-teal-700">
                  <button 
                    onClick={addInventoryRow}
                    className="flex items-center text-teal-500 hover:text-emerald-400 text-sm font-semibold transition-colors"
                  >
                    <Plus size={16} className="mr-1" /> Thêm dòng xuất/nhập
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-w-[800px]">
              <div className="flex items-stretch border border-teal-700 rounded overflow-hidden">
                <div className="bg-emerald-900/60 p-3 font-semibold min-w-[180px] text-center flex items-center justify-center border-r border-teal-700 text-emerald-300">
                  Nếu Nhập (Ngày nhập)
                </div>
                <div className="bg-gray-900 p-3 flex-1 font-semibold flex items-center justify-center text-center text-teal-500/80">
                  TỒN CUỐI KỲ = NHẬP TRONG KỲ TRƯỚC ĐÓ + TỒN CUỐI KỲ TRƯỚC ĐÓ - XUẤT TRONG KỲ
                </div>
              </div>
              <div className="flex items-stretch border border-teal-700 rounded overflow-hidden">
                <div className="bg-emerald-900/60 p-3 font-semibold min-w-[180px] text-center flex items-center justify-center border-r border-teal-700 text-emerald-300">
                  Nếu Xuất (Ngày Xuất)
                </div>
                <div className="bg-gray-900 p-3 flex-1 font-semibold flex items-center justify-center text-center text-teal-500/80">
                  TỒN CUỐI KỲ = TỒN CUỐI KỲ TRƯỚC ĐÓ - XUẤT TRONG KỲ
                </div>
              </div>
              <div className="flex items-stretch border border-teal-700 rounded overflow-hidden">
                <div className="bg-emerald-900/60 p-3 font-semibold min-w-[180px] text-center flex items-center justify-center border-r border-teal-700 text-emerald-300">
                  Nếu Vừa Nhập Và Xuất
                </div>
                <div className="bg-gray-900 p-3 flex-1 font-semibold flex items-center justify-center text-center text-teal-500/80">
                  TỒN CUỐI KỲ = TỒN CUỐI KỲ TRƯỚC ĐÓ + NHẬP TRONG KỲ TRƯỚC ĐÓ - XUẤT TRONG KỲ TRƯỚC ĐÓ
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-8">
            {batches.map((batch, batchIndex) => {
              const batchTotal = batch.items.reduce((sum, item) => sum + (Number(item.soLuong) * Number(item.gia) || 0), 0);
              
              return (
                <div key={batchIndex} className="overflow-x-auto rounded-md border border-teal-600 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                  <table className="w-full border-collapse text-center min-w-[600px] bg-gray-900">
                    <thead>
                      <tr>
                        <th className="border border-teal-700 p-3 bg-yellow-900/40 text-yellow-500 uppercase w-48 tracking-wider">
                          {product.name} ĐỢT {batchIndex + 1}
                        </th>
                        <th className="border border-teal-700 p-3 bg-teal-900/40 text-emerald-300 w-32">NGUỒN NHẬP</th>
                        <th className="border border-teal-700 p-3 bg-teal-900/40 text-emerald-300 w-32">NGÀY NHẬP</th>
                        <th className="border border-teal-700 p-3 bg-teal-900/40 text-emerald-300 w-32">SỐ LƯỢNG (MÉT)</th>
                        <th className="border border-teal-700 p-3 bg-teal-900/40 text-emerald-300 w-32">GIÁ</th>
                        <th className="border border-teal-700 p-3 bg-teal-900/40 text-emerald-300 w-40">TỔNG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batch.items.map((item, itemIndex) => (
                        <tr key={itemIndex} className="hover:bg-gray-800 transition-colors">
                          <td className="border border-teal-700 p-3 font-semibold text-emerald-200">{item.name}</td>
                          <td className="border border-teal-700 p-0">
                            <input 
                              type="text" 
                              value={item.nguonNhap || ""} 
                              onChange={(e) => handleBatchItemChange(batchIndex, itemIndex, "nguonNhap", e.target.value)}
                              className="w-full h-full text-center bg-transparent outline-none text-teal-200 py-3"
                            />
                          </td>
                          <td className="border border-teal-700 p-0">
                            <input 
                              type="date" 
                              value={item.ngayNhap || ""} 
                              onChange={(e) => handleBatchItemChange(batchIndex, itemIndex, "ngayNhap", e.target.value)}
                              className="w-full h-full text-center bg-transparent outline-none text-teal-200 py-3 [color-scheme:dark]"
                            />
                          </td>
                          <td className="border border-teal-700 p-0">
                            <input 
                              type="number" 
                              value={item.soLuong || ""} 
                              onChange={(e) => handleBatchItemChange(batchIndex, itemIndex, "soLuong", e.target.value)}
                              className="w-full h-full text-center bg-transparent outline-none text-teal-200 py-3"
                            />
                          </td>
                          <td className="border border-teal-700 p-0">
                            <input 
                              type="number" 
                              value={item.gia || ""} 
                              onChange={(e) => handleBatchItemChange(batchIndex, itemIndex, "gia", e.target.value)}
                              className="w-full h-full text-center bg-transparent outline-none text-teal-200 py-3"
                            />
                          </td>
                          <td className="border border-teal-700 p-3 text-emerald-400">
                            {formatCurrency(Number(item.soLuong) * Number(item.gia) || 0)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-teal-950/50 font-bold">
                        <td colSpan="5" className="border border-teal-700 p-4 text-center uppercase tracking-widest text-emerald-300">Tổng Cộng</td>
                        <td className="border border-teal-700 p-4 text-yellow-400 text-lg">{formatCurrency(batchTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
            
            <button 
              onClick={addBatch}
              className="bg-teal-800/50 border border-teal-500 text-emerald-300 p-4 font-bold hover:bg-teal-700/60 hover:text-emerald-100 transition-all rounded-md self-center px-24 mt-2 shadow-[0_0_15px_rgba(20,184,166,0.2)]"
            >
              THÊM ĐỢT MỚI ( + )
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionDetailPage;