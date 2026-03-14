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
      const prevTonCuoi = i === 0
        ? {
            S: Number(newData[i].tonDauKy?.S) || 0,
            M: Number(newData[i].tonDauKy?.M) || 0,
            L: Number(newData[i].tonDauKy?.L) || 0,
            XL: Number(newData[i].tonDauKy?.XL) || 0
          }
        : {
            S: Number(newData[i-1].tonCuoiKy?.S) || 0,
            M: Number(newData[i-1].tonCuoiKy?.M) || 0,
            L: Number(newData[i-1].tonCuoiKy?.L) || 0,
            XL: Number(newData[i-1].tonCuoiKy?.XL) || 0
          };

      if (i > 0) {
        newData[i].tonDauKy = { ...prevTonCuoi, total: prevTonCuoi.S + prevTonCuoi.M + prevTonCuoi.L + prevTonCuoi.XL };
      } else {
        newData[i].tonDauKy.total = (Number(newData[i].tonDauKy?.S) || 0) + (Number(newData[i].tonDauKy?.M) || 0) + (Number(newData[i].tonDauKy?.L) || 0) + (Number(newData[i].tonDauKy?.XL) || 0);
      }

      const nhap = {
        S: Number(newData[i].nhapTrongKy?.S) || 0,
        M: Number(newData[i].nhapTrongKy?.M) || 0,
        L: Number(newData[i].nhapTrongKy?.L) || 0,
        XL: Number(newData[i].nhapTrongKy?.XL) || 0
      };
      newData[i].nhapTrongKy.total = nhap.S + nhap.M + nhap.L + nhap.XL;

      const xuat = {
        S: Number(newData[i].xuatTrongKy?.S) || 0,
        M: Number(newData[i].xuatTrongKy?.M) || 0,
        L: Number(newData[i].xuatTrongKy?.L) || 0,
        XL: Number(newData[i].xuatTrongKy?.XL) || 0
      };
      newData[i].xuatTrongKy.total = xuat.S + xuat.M + xuat.L + xuat.XL;

      newData[i].tonCuoiKy = {
        S: prevTonCuoi.S + nhap.S - xuat.S,
        M: prevTonCuoi.M + nhap.M - xuat.M,
        L: prevTonCuoi.L + nhap.L - xuat.L,
        XL: prevTonCuoi.XL + nhap.XL - xuat.XL,
      };
      newData[i].tonCuoiKy.total = newData[i].tonCuoiKy.S + newData[i].tonCuoiKy.M + newData[i].tonCuoiKy.L + newData[i].tonCuoiKy.XL;
    }
    return newData;
  };

  const handleInventoryChange = (index, category, field, value) => {
    const newData = [...inventory];
    if (field) {
      if (!newData[index][category]) {
        newData[index][category] = { total: 0, S: 0, M: 0, L: 0, XL: 0 };
      }
      newData[index][category][field] = value;
    } else {
      newData[index][category] = value;
      // Đồng bộ ngày nhập/xuất tự động
      if (category === "ngayNhap") {
        newData[index].ngayXuat = value;
      } else if (category === "ngayXuat") {
        newData[index].ngayNhap = value;
      }
    }
    setInventory(calculateInventory(newData));
  };

  const addInventoryRow = () => {
    setInventory(prev => [
      ...prev,
      {
        tonDauKy: { total: 0, S: 0, M: 0, L: 0, XL: 0 },
        ngayNhap: "",
        nhapTrongKy: { total: 0, S: 0, M: 0, L: 0, XL: 0 },
        ngayXuat: "",
        xuatTrongKy: { total: 0, S: 0, M: 0, L: 0, XL: 0 },
        tonCuoiKy: { total: 0, S: 0, M: 0, L: 0, XL: 0 }
      }
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
    if (!amount) return "-";
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] text-gray-900 p-8 pt-24 text-center">Đang tải...</div>;
  if (!product) return <div className="min-h-screen bg-[#FDFBF7] text-gray-900 p-8 pt-24 text-center">Không tìm thấy sản phẩm</div>;

  const SizeInputs = ({ row, index, category, isReadOnly }) => {
    const total = row[category]?.total || 0;
    const isTonCuoiKy = category === "tonCuoiKy";
    
    return (
      <>
        <td className={`border border-black p-0 min-w-[40px] bg-gray-100 font-bold ${isTonCuoiKy ? 'text-red-600' : ''}`}>
          {total === 0 ? "-" : total}
        </td>
        {['S', 'M', 'L', 'XL'].map(size => {
          const val = row[category]?.[size];
          return (
            <td key={size} className="border border-black p-0 min-w-[40px]">
              <input
                type="number"
                value={val || ""}
                placeholder="-"
                onChange={(e) => handleInventoryChange(index, category, size, e.target.value)}
                disabled={isReadOnly}
                className="w-full h-full text-center bg-transparent outline-none py-2 disabled:bg-transparent"
              />
            </td>
          );
        })}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 p-4 pt-24 text-sm pb-20">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate("/admin/production")}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors font-semibold"
          >
            <ArrowLeft className="mr-2" size={20} />
            Quay lại
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-bold transition-colors disabled:opacity-50 shadow-md"
          >
            <Save className="mr-2" size={20} />
            {isSaving ? "ĐANG LƯU..." : "LƯU THAY ĐỔI"}
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center uppercase tracking-widest text-black">
          CHI TIẾT SẢN XUẤT - {product.name}
        </h1>

        <div className="flex flex-col 2xl:flex-row gap-8 items-start">
          <div className="w-full 2xl:w-1/2 flex flex-col gap-6 min-w-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-48 border-2 border-black bg-white flex flex-col items-center justify-center p-2 shadow-sm shrink-0">
                <span className="font-bold text-center uppercase mb-2 text-base">{product.name}</span>
                <img 
                  src={product.thumbnail || product.image} 
                  alt={product.name}
                  loading="lazy"
                  className="w-full object-contain"
                />
              </div>

              <div className="flex-1 overflow-x-auto shadow-sm min-w-0">
                <table className="w-full border-collapse text-center border-2 border-black bg-white text-xs whitespace-nowrap">
                  <thead>
                    <tr>
                      <th className="border border-black p-2 bg-[#8FAADC]" colSpan="5">TỒN ĐẦU KỲ</th>
                      <th className="border border-black p-2 bg-[#A9D08E]" rowSpan="2">NGÀY NHẬP</th>
                      <th className="border border-black p-2 bg-[#A9D08E]" colSpan="5">NHẬP TRONG KỲ</th>
                      <th className="border border-black p-2 bg-[#F4B084]" rowSpan="2">NGÀY XUẤT</th>
                      <th className="border border-black p-2 bg-[#F4B084]" colSpan="5">XUẤT TRONG KỲ</th>
                      <th className="border border-black p-2 bg-[#8FAADC]" colSpan="5">TỒN CUỐI KỲ</th>
                    </tr>
                    <tr>
                      {['Tổng', 'S', 'M', 'L', 'XL'].map((h, i) => <th key={`td-${i}`} className="border border-black p-1 bg-gray-100">{h}</th>)}
                      {['Tổng', 'S', 'M', 'L', 'XL'].map((h, i) => <th key={`n-${i}`} className="border border-black p-1 bg-gray-100">{h}</th>)}
                      {['Tổng', 'S', 'M', 'L', 'XL'].map((h, i) => <th key={`x-${i}`} className="border border-black p-1 bg-gray-100">{h}</th>)}
                      {['Tổng', 'S', 'M', 'L', 'XL'].map((h, i) => <th key={`tc-${i}`} className="border border-black p-1 bg-gray-100">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <SizeInputs row={row} index={index} category="tonDauKy" isReadOnly={index !== 0} />
                        
                        <td className="border border-black p-0 min-w-[100px]">
                          <input 
                            type="text" 
                            value={row.ngayNhap || ""} 
                            placeholder="-"
                            onChange={(e) => handleInventoryChange(index, "ngayNhap", null, e.target.value)}
                            className="w-full h-full text-center bg-transparent outline-none py-2 text-xs"
                          />
                        </td>
                        
                        <SizeInputs row={row} index={index} category="nhapTrongKy" isReadOnly={false} />
                        
                        <td className="border border-black p-0 min-w-[100px]">
                          <input 
                            type="text" 
                            value={row.ngayXuat || ""} 
                            placeholder="-"
                            onChange={(e) => handleInventoryChange(index, "ngayXuat", null, e.target.value)}
                            className="w-full h-full text-center bg-transparent outline-none py-2 text-xs"
                          />
                        </td>
                        
                        <SizeInputs row={row} index={index} category="xuatTrongKy" isReadOnly={false} />
                        <SizeInputs row={row} index={index} category="tonCuoiKy" isReadOnly={true} />
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-white p-2 border-t-0 border-2 border-black">
                  <button 
                    onClick={addInventoryRow}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors"
                  >
                    <Plus size={16} className="mr-1" /> Thêm dòng xuất/nhập
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full 2xl:w-1/2 flex flex-col gap-6 min-w-0">
            {batches.map((batch, batchIndex) => {
              const batchTotal = batch.items.reduce((sum, item) => sum + (Number(item.soLuong) * Number(item.gia) || 0), 0);
              
              return (
                <div key={batchIndex} className="overflow-x-auto shadow-sm min-w-0">
                  <table className="w-full border-collapse text-center border-2 border-black bg-white whitespace-nowrap">
                    <thead>
                      <tr>
                        <th className="border border-black p-3 bg-[#FFC000] text-red-600 uppercase w-48 font-bold">
                          {product.name} ĐỢT {batchIndex + 1}
                        </th>
                        <th className="border border-black p-3 bg-[#FFC000] w-32 font-bold">NGUỒN NHẬP</th>
                        <th className="border border-black p-3 bg-[#FFC000] w-32 font-bold">NGÀY NHẬP</th>
                        <th className="border border-black p-3 bg-[#FFC000] w-32 font-bold">SỐ LƯỢNG (MÉT)</th>
                        <th className="border border-black p-3 bg-[#FFC000] w-32 font-bold">GIÁ</th>
                        <th className="border border-black p-3 bg-[#FFC000] w-40 font-bold">TỔNG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batch.items.map((item, itemIndex) => (
                        <tr key={itemIndex} className="hover:bg-gray-50 transition-colors">
                          <td className="border border-black p-2 font-semibold">{item.name}</td>
                          <td className="border border-black p-0">
                            <input 
                              type="text" 
                              value={item.nguonNhap || ""} 
                              placeholder="-"
                              onChange={(e) => handleBatchItemChange(batchIndex, itemIndex, "nguonNhap", e.target.value)}
                              className="w-full h-full text-center bg-transparent outline-none py-2"
                            />
                          </td>
                          <td className="border border-black p-0">
                            <input 
                              type="text" 
                              value={item.ngayNhap || ""} 
                              placeholder="dd/mm/yyyy"
                              onChange={(e) => handleBatchItemChange(batchIndex, itemIndex, "ngayNhap", e.target.value)}
                              className="w-full h-full text-center bg-transparent outline-none py-2"
                            />
                          </td>
                          <td className="border border-black p-0">
                            <input 
                              type="number" 
                              value={item.soLuong || ""} 
                              placeholder="-"
                              onChange={(e) => handleBatchItemChange(batchIndex, itemIndex, "soLuong", e.target.value)}
                              className="w-full h-full text-center bg-transparent outline-none py-2"
                            />
                          </td>
                          <td className="border border-black p-0">
                            <input 
                              type="number" 
                              value={item.gia || ""} 
                              placeholder="-"
                              onChange={(e) => handleBatchItemChange(batchIndex, itemIndex, "gia", e.target.value)}
                              className="w-full h-full text-center bg-transparent outline-none py-2"
                            />
                          </td>
                          <td className="border border-black p-2 font-medium">
                            {formatCurrency(Number(item.soLuong) * Number(item.gia) || 0)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-[#FFC000] font-bold">
                        <td colSpan="5" className="border border-black p-3 text-right uppercase pr-6">Tổng Cộng</td>
                        <td className="border border-black p-3 text-red-600 text-lg">{formatCurrency(batchTotal)} ₫</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
            
            <button 
              onClick={addBatch}
              className="bg-[#A9D08E] border-2 border-black text-black p-3 font-bold hover:bg-[#96c179] transition-all rounded-sm self-center px-12 sm:px-24 mt-2 shadow-sm"
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