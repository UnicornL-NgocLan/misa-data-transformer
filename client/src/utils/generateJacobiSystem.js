// utils/generateJacobiSystem.js

export function generateJacobiSystem(tonDauKy, giaoDich) {
  const productMap = {} // { SP1: { khoMap: {}, equations: [] } }

  // Gom tất cả các kho và sản phẩm
  const allProducts = new Set()
  tonDauKy.forEach((row) => allProducts.add(row['sản phẩm']))
  giaoDich.forEach((row) => allProducts.add(row['sản phẩm']))

  // Với mỗi sản phẩm, lập hệ phương trình
  for (const product of allProducts) {
    // Lấy các thông tin liên quan tồn đầu kỳ và giao dịchdịch
    const productTonDauKy = tonDauKy.filter((r) => r['sản phẩm'] === product)
    const productGD = giaoDich.filter((r) => r['sản phẩm'] === product)

    const khoSet = new Set()

    // Lấy danh sách các kho
    productTonDauKy.forEach((r) => khoSet.add(r.kho))
    productGD.forEach((r) => {
      if (r['kho nhập']) khoSet.add(r['kho nhập'])
      if (r['kho xuất']) khoSet.add(r['kho xuất'])
    })

    const khoList = Array.from(khoSet)
    const khoMap = {} // Từ [A,B,C,D] đưa về dạng {A:0,B:1,C:2,D:3,..}
    khoList.forEach((kho, idx) => (khoMap[kho] = idx))

    // Số lượng kho cũng chính là số lượng ẩn
    const n = khoList.length
    const equations = []

    for (const kho of khoList) {
      const idx = khoMap[kho]

      // Tử số (số hạng bên phải)
      let constant = 0

      // Thành phần tồn đầu kỳ
      const tonKho = productTonDauKy.find((r) => r.kho === kho)
      const soLuongDauKy = tonKho ? Number(tonKho['tồn đầu kỳ']) : 0
      const donGiaDauKy = tonKho ? Number(tonKho['đơn giá tồn đầu kỳ']) : 0
      constant += soLuongDauKy * donGiaDauKy

      // Thành phần nhập từ bên ngoài
      const nhapNgoai = productGD.filter(
        (r) => r['kho nhập'] === kho && !r['kho xuất']
      )
      nhapNgoai.forEach((r) => {
        constant += Number(r['giá trị'] || 0)
      })

      // Thành phần nhập từ kho khác (chuyển kho)
      const nhapTuKho = productGD.filter(
        (r) => r['kho nhập'] === kho && r['kho xuất']
      )

      // Tạo hệ số cho các ẩn khác nếu đơn giá chưa biết (giá trị chưa có) → hệ số cho kho xuất.
      const coeffs = new Array(n).fill(0)

      nhapTuKho.forEach((r) => {
        const khoXuat = r['kho xuất']
        const soLuong = Number(r['số lượng'] || 0)
        const idxXuat = khoMap[khoXuat]
        // Gán hệ số cho ẩn (kho xuất)
        coeffs[idxXuat] += soLuong
      })

      // Mẫu số (tổng số lượng)
      let denominator = soLuongDauKy
      nhapNgoai.forEach((r) => (denominator += Number(r['số lượng'] || 0)))
      nhapTuKho.forEach((r) => (denominator += Number(r['số lượng'] || 0)))

      // Normalize phương trình: chia cả 2 vế cho mẫu
      if (denominator === 0) {
        // Không thể xác định đơn giá (không có lượng)
        const eq = { coeffs: new Array(n).fill(0), constant: 0 }
        eq.coeffs[idx] = 1 // hệ số của kho đang xét = 1, các kho còn lại = 0
        equations.push(eq)
      } else {
        const eq = {
          coeffs: coeffs.map((c) => -c / denominator),
          constant: constant / denominator,
        }
        eq.coeffs[idx] = 1 // hệ số chính
        equations.push(eq)
      }
    }

    productMap[product] = { equations, khoMap }
  }

  return Object.entries(productMap).map(([product, val]) => ({
    product,
    equations: val.equations,
    khoMap: val.khoMap,
  }))
}
