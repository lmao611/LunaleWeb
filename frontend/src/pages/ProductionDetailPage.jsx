import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProductStore } from "../stores/useProductStore";
import { useProductionStore } from "../stores/useProductionStore";
import { ArrowLeft, Plus, Check, Loader2, Trash2, Lock } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const MaskedDateInput = ({ value, onChange, className }) => {
  const handleChange = (e) => {
    let input = e.target.value.replace(/\D/g, "");
    if (input.length > 8) input = input.substring(0, 8);
    
    let formatted = input;
    if (input.length > 4) {
      formatted = `${input.substring(0, 2)}/${input.substring(2, 4)}/${input.substring(4)}`;
    } else if (input.length > 2) {
      formatted = `${input.substring(0, 2)}/${input.substring(2)}`;
    }
    onChange(formatted);
  };

  const handleBlur = (e) => {
    if (!e.target.value || e.target.value.trim() === "") {
      onChange("-");
    }
  };

  const handleFocus = () => {
    if (value === "-") {
      onChange("");
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder="-"
      className={className}
    />
  );
};

const ProductionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchProductById } = useProductStore();
  const { fetchProduction, saveProduction } = useProductionStore();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("saved");
  
  // --- BẢO MẬT MỚI: State kiểm tra quyền từ Server ---
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const [inventory, setInventory] = useState([]);
  const [batches, setBatches] = useState([]);

  const initialLoadRef = useRef(true);
  const timeoutRef = useRef(null);

  // KIỂM TRA BẢO MẬT VỚI BACKEND TRƯỚC KHI RENDER
  useEffect(() => {
    const checkSession = async () => {
      try {
        await axios.get("/production/check-auth");
        setIsAuthorized(true);
      } catch (error) {
        setIsAuthorized(false);
        toast.error("Phiên đăng nhập hết hạn. Vui lòng nhập lại mật khẩu.");
        navigate("/admin/production"); 
      } finally {
        setIsChecking(false);
      }
    };
    checkSession();
  }, [navigate]);

  useEffect(() => {
    if (!isAuthorized) return;
    
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
  }, [id, fetchProductById, fetchProduction, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;

    if (initialLoadRef.current) {
      if (!loading && product) {
        initialLoadRef.current = false;
      }
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setSaveStatus("saving");
    timeoutRef.current = setTimeout(async () => {
      await saveProduction(id, { inventory, batches }, false);
      setSaveStatus("saved");
    }, 1500);

    return () => clearTimeout(timeoutRef.current);
  }, [inventory, batches, id, saveProduction, loading, product, isAuthorized]);

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
        ngayNhap: "-",
        nhapTrongKy: { total: 0, S: 0, M: 0, L: 0, XL: 0 },
        ngayXuat: "-",
        xuatTrongKy: { total: 0, S: 0, M: 0, L: 0, XL: 0 },
        tonCuoiKy: { total: 0, S: 0, M: 0, L: 0, XL: 0 }
      }
    ]);
  };

  const removeInventoryRow = (indexToRemove) => {
    if (indexToRemove === 0) return;
    const newInventory = inventory.filter((_, idx) => idx !== indexToRemove);
    setInventory(calculateInventory(newInventory));
  };

  const handleBatchItemChange = (batchIndex, itemIndex, field, value) => {
    const newBatches = [...batches];
    newBatches[batchIndex].items[itemIndex][field] = value;
    setBatches(newBatches);
  };

  const addBatch = () => {
    setBatches(prev => {
      if (prev.length === 0) {
        return [{ items: [] }]; 
      }
      const lastBatch = prev[prev.length - 1];
      const newItems = lastBatch.items.map(item => ({
        name: item.name,
        nguonNhap: "",
        ngayNhap: "-",
        soLuong: 0,
        gia: 0
      }));
      return [...prev, { items: newItems }];
    });
  };

  const removeBatch = (batchIndex) => {
    const newBatches = [...batches];
    newBatches.splice(batchIndex, 1);
    setBatches(newBatches);
  };

  const addBatchItem = (batchIndex) => {
    const newBatches = [...batches];
    newBatches[batchIndex].items.push({
      name: "",
      nguonNhap: "",
      ngayNhap: "-",
      soLuong: 0,
      gia: 0
    });
    setBatches(newBatches);
  };

  const removeBatchItem = (batchIndex, itemIndex) => {
    const newBatches = [...batches];
    newBatches[batchIndex].items.splice(itemIndex, 1);
    setBatches(newBatches);
  };

  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  // Màn hình chờ kiểm tra phiên
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-xl font-bold text-gray-500 animate-pulse flex items-center gap-2">
           <Lock size={24}/> Đang xác thực bảo mật...
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] text-gray-900 p-4 sm:p-8 pt-20 sm:pt-24 text-center">Đang tải...</div>;
  if (!product) return <div className="min-h-screen bg-[#FDFBF7] text-gray-900 p-4 sm:p-8 pt-20 sm:pt-24 text-center">Không tìm thấy sản phẩm</div>;

  const renderSizeInputs = (row, index, category, isReadOnly) => {
    const total = row[category]?.total || 0;
    const isTonCuoiKy = category === "tonCuoiKy";
    
    return (
      <>
        <td className={`border border-black p-0 min-w-[30px] sm:min-w-[40px] bg-gray-100 font-bold ${isTonCuoiKy ? 'text-red-600' : ''}`}>
          {total === 0 ? "-" : total}
        </td>
        {['S', 'M', 'L', 'XL'].map(size => {
          const val = row[category]?.[size];
          return (
            <td key={size} className="border border-black p-0 min-w-[30px] sm:min-w-[40px]">
              <input
                type="number"
                value={val || ""}
                placeholder="-"
                onChange={(e) => handleInventoryChange(index, category, size, e.target.value)}
                disabled={isReadOnly}
                className="w-full h-full text-center bg-transparent outline-none py-1.5 sm:py-2 disabled:bg-transparent"
              />
            </td>
          );
        })}
      </>
    );
  };

  const grandTotalBatches = batches.reduce((total, batch) => {
    return total + batch.items.reduce((sum, item) => sum + (Number(item.soLuong) * Number(item.gia) || 0), 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 p-3 sm:p-4 pt-20 sm:pt-24 text-xs sm:text-sm pb-20">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <button
            onClick={() => navigate("/admin/production")}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors font-semibold text-sm sm:text-base"
          >
            <ArrowLeft className="mr-1.5 sm:mr-2" size={18} />
            Quay lại
          </button>
          
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium w-full sm:w-auto">
            {saveStatus === "saving" ? (
              <span className="flex items-center justify-center w-full sm:w-auto text-blue-600 bg-blue-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md">
                <Loader2 className="mr-1.5 sm:mr-2 animate-spin" size={14} /> Đang lưu...
              </span>
            ) : (
              <span className="flex items-center justify-center w-full sm:w-auto text-emerald-600 bg-emerald-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md">
                <Check className="mr-1.5 sm:mr-2" size={14} /> Đã lưu tự động
              </span>
            )}
          </div>
        </div>

        <h1 className="text-xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center uppercase tracking-widest text-black">
          CHI TIẾT SẢN XUẤT - {product.name}
        </h1>

        <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 items-start">
          <div className="w-full xl:w-1/2 flex flex-col gap-4 sm:gap-6 min-w-0">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="w-full sm:w-40 md:w-48 border-2 border-black bg-white flex flex-col items-center justify-center p-2 shadow-sm shrink-0">
                <span className="font-bold text-center uppercase mb-2 text-sm sm:text-base">{product.name}</span>
                <img 
                  src={product.thumbnail || product.image} 
                  alt={product.name}
                  loading="lazy"
                  className="w-24 sm:w-full object-contain"
                />
              </div>

              <div className="flex-1 overflow-x-auto shadow-sm min-w-0">
                <table className="w-full border-collapse text-center border-2 border-black bg-white text-[10px] sm:text-xs whitespace-nowrap">
                  <thead>
                    <tr>
                      <th className="border border-black p-1.5 sm:p-2 bg-[#8FAADC]" colSpan="5">TỒN ĐẦU KỲ</th>
                      <th className="border border-black p-1.5 sm:p-2 bg-[#A9D08E]" rowSpan="2">NGÀY NHẬP</th>
                      <th className="border border-black p-1.5 sm:p-2 bg-[#A9D08E]" colSpan="5">NHẬP TRONG KỲ</th>
                      <th className="border border-black p-1.5 sm:p-2 bg-[#F4B084]" rowSpan="2">NGÀY XUẤT</th>
                      <th className="border border-black p-1.5 sm:p-2 bg-[#F4B084]" colSpan="5">XUẤT TRONG KỲ</th>
                      <th className="border border-black p-1.5 sm:p-2 bg-[#8FAADC]" colSpan="5">TỒN CUỐI KỲ</th>
                      <th className="border border-black p-1.5 sm:p-2 bg-red-100" rowSpan="2">Xóa</th>
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
                        {renderSizeInputs(row, index, "tonDauKy", index !== 0)}
                        
                        <td className="border border-black p-0 min-w-[80px] sm:min-w-[110px]">
                          <MaskedDateInput 
                            value={row.ngayNhap || "-"} 
                            onChange={(val) => handleInventoryChange(index, "ngayNhap", null, val)}
                            className="w-full h-full text-center bg-transparent outline-none py-1.5 sm:py-2 text-[10px] sm:text-xs"
                          />
                        </td>
                        
                        {renderSizeInputs(row, index, "nhapTrongKy", false)}
                        
                        <td className="border border-black p-0 min-w-[80px] sm:min-w-[110px]">
                          <MaskedDateInput 
                            value={row.ngayXuat || "-"} 
                            onChange={(val) => handleInventoryChange(index, "ngayXuat", null, val)}
                            className="w-full h-full text-center bg-transparent outline-none py-1.5 sm:py-2 text-[10px] sm:text-xs"
                          />
                        </td>
                        
                        {renderSizeInputs(row, index, "xuatTrongKy", false)}
                        {renderSizeInputs(row, index, "tonCuoiKy", true)}
                        
                        <td className="border border-black p-0 align-middle">
                          {index > 0 && (
                            <button
                              onClick={() => removeInventoryRow(index)}
                              className="text-red-500 hover:text-red-700 w-full h-full flex items-center justify-center py-1.5 sm:py-2"
                              title="Xóa hàng này"
                            >
                              <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-white p-2 border-t-0 border-2 border-black">
                  <button 
                    onClick={addInventoryRow}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-semibold transition-colors"
                  >
                    <Plus size={14} className="mr-1 sm:w-4 sm:h-4" /> Thêm dòng xuất/nhập
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full xl:w-1/2 flex flex-col gap-4 sm:gap-6 min-w-0">
            {batches.map((batch, batchIndex) => {
              const batchTotal = batch.items.reduce((sum, item) => sum + (Number(item.soLuong) * Number(item.gia) || 0), 0);
              
              return (
                <div key={batchIndex} className="overflow-x-auto shadow-sm min-w-0 relative">
                  <div className="flex justify-between items-end mb-1 sm:mb-1.5">
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-500">Bảng đợt {batchIndex + 1}</span>
                    <button 
                      onClick={() => removeBatch(batchIndex)} 
                      className="text-red-500 hover:text-red-700 text-[10px] sm:text-xs font-semibold flex items-center transition-colors"
                    >
                      <Trash2 size={10} className="mr-1 sm:w-3 sm:h-3"/> Xóa đợt này
                    </button>
                  </div>
                  
                  <table className="w-full border-collapse text-center border-2 border-black bg-white whitespace-nowrap text-[10px] sm:text-xs">
                    <thead>
                      <tr>
                        <th className="border border-black p-2 sm:p-3 bg-[#FFC000] text-red-600 uppercase min-w-[120px] sm:w-48 font-bold">
                          {product.name} ĐỢT {batchIndex + 1}
                        </th>
                        <th className="border border-black p-2 sm:p-3 bg-[#FFC000] min-w-[80px] sm:w-32 font-bold">NGUỒN NHẬP</th>
                        <th className="border border-black p-2 sm:p-3 bg-[#FFC000] min-w-[80px] sm:w-32 font-bold">NGÀY NHẬP</th>
                        <th className="border border-black p-2 sm:p-3 bg-[#FFC000] min-w-[90px] sm:w-32 font-bold">SỐ LƯỢNG (MÉT)</th>
                        <th className="border border-black p-2 sm:p-3 bg-[#FFC000] min-w-[80px] sm:w-32 font-bold">GIÁ</th>
                        <th className="border border-black p-2 sm:p-3 bg-[#FFC000] min-w-[100px] sm:w-40 font-bold">TỔNG</th>
                        <th className="border border-black p-2 sm:p-3 bg-[#FFC000] w-8 sm:w-10 font-bold">Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batch.items.map((item, itemIndex) => (
                        <tr key={itemIndex} className="hover:bg-gray-50 transition-colors">
                          <td className="border border-black p-0">
                            <input 
                              type="text" 
                              value={item.name || ""} 
                              placeholder="Tên nguyên liệu"
                              onChange={(e) => handleBatchItemChange(batchIndex, itemIndex, "name", e.target.value)}
                              className="w-full h-full text-center bg-transparent outline-none py-1.5 sm:py-2 font-semibold"
                            />
                          </td>
                          <td className="border border-black p-0">
                            <input 
                              type="text" 
                              value={item.nguonNhap || ""} 
                              placeholder="-"
                              onChange={(e) => handleBatchItemChange(batchIndex, itemIndex, "nguonNhap", e.target.value)}
                              className="w-full h-full text-center bg-transparent outline-none py-1.5 sm:py-2"
                            />
                          </td>
                          <td className="border border-black p-0">
                            <MaskedDateInput 
                              value={item.ngayNhap || "-"} 
                              onChange={(val) => handleBatchItemChange(batchIndex, itemIndex, "ngayNhap", val)}
                              className="w-full h-full text-center bg-transparent outline-none py-1.5 sm:py-2"
                            />
                          </td>
                          <td className="border border-black p-0">
                            <input 
                              type="number" 
                              value={item.soLuong || ""} 
                              placeholder="-"
                              onChange={(e) => handleBatchItemChange(batchIndex, itemIndex, "soLuong", e.target.value)}
                              className="w-full h-full text-center bg-transparent outline-none py-1.5 sm:py-2"
                            />
                          </td>
                          <td className="border border-black p-0">
                            <input 
                              type="text" 
                              value={item.gia ? new Intl.NumberFormat('vi-VN').format(item.gia) : ""} 
                              placeholder="-"
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, "");
                                handleBatchItemChange(batchIndex, itemIndex, "gia", rawValue ? Number(rawValue) : 0);
                              }}
                              className="w-full h-full text-center bg-transparent outline-none py-1.5 sm:py-2"
                            />
                          </td>
                          <td className="border border-black p-1.5 sm:p-2 font-medium">
                            {formatCurrency(Number(item.soLuong) * Number(item.gia) || 0)}
                          </td>
                          <td className="border border-black p-0 align-middle">
                            <button
                              onClick={() => removeBatchItem(batchIndex, itemIndex)}
                              className="text-red-500 hover:text-red-700 w-full h-full flex items-center justify-center py-1.5 sm:py-2"
                            >
                              <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td colSpan="7" className="border border-black p-1.5 sm:p-2">
                          <button 
                            onClick={() => addBatchItem(batchIndex)}
                            className="flex items-center text-blue-600 hover:text-blue-800 text-[10px] sm:text-sm font-semibold transition-colors mx-auto"
                          >
                            <Plus size={14} className="mr-1 sm:w-4 sm:h-4" /> Thêm nguyên liệu
                          </button>
                        </td>
                      </tr>
                      <tr className="bg-[#FFC000] font-bold">
                        <td colSpan="5" className="border border-black p-2 sm:p-3 text-right uppercase pr-3 sm:pr-6 text-[10px] sm:text-xs">Tổng Cộng</td>
                        <td colSpan="2" className="border border-black p-2 sm:p-3 text-red-600 text-sm sm:text-lg text-left">{formatCurrency(batchTotal)} ₫</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
            
            <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3 sm:gap-4 mt-2">
              <button 
                onClick={addBatch}
                className="bg-[#A9D08E] border-2 border-black text-black p-2 sm:p-3 font-bold hover:bg-[#96c179] transition-all rounded-sm flex-1 shadow-sm text-xs sm:text-sm"
              >
                THÊM ĐỢT MỚI ( + )
              </button>
              <div className="flex-1 bg-[#FFC000] border-2 border-black text-black p-2 sm:p-3 font-bold flex items-center justify-between shadow-sm text-sm sm:text-lg px-4 sm:px-6 uppercase">
                <span className="text-xs sm:text-sm">Tổng tất cả:</span>
                <span className="text-red-600">{formatCurrency(grandTotalBatches)} ₫</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionDetailPage;