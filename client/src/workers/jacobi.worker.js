// Dưới đây là cách giải hệ phương trình bậc nhất nhiều ẩn bằng phương pháp lặp của Jacobi :)) Mình đã note và giải thích từng bước lại
// Nhưng nếu muốn hiểu thêm thì người đang xem đoạn code này lên mạng đọc phương pháp lặp của Jacobi nha ^^

onmessage = function (e) {
  const { equations, tolerance = 1e-8, maxIter = 1000 } = e.data
  const n = equations.length
  let x = new Array(n).fill(0)
  // xNew dùng để lưu tạm ẩn mới và so sánh với ẩn hiện tại ở cuối đợt tính toán của vòng lặp
  let xNew = [...x]
  // Đây là biến cho biến tất cả phương trình trong hệ đã hội tụ hay chưa
  let converged = false

  // Đây là một đợt lặp của hệ phương trình (ma trận vuông)
  for (let iter = 0; iter < maxIter; iter++) {
    converged = true
    // Xét từng phương trình trong hệ phương trình
    for (let i = 0; i < n; i++) {
      const { coeffs, constant } = equations[i]
      let sum = constant
      // Xét từng hệ số trong phương trình
      for (let j = 0; j < n; j++) {
        // Nếu i = j thì skip vì cùng biến, ta thay giá trị biến hiện tại vào biến, sau đó chuyển vế đổi dấu
        // Ví dụ: 2x - 0.5y = 100. Khi mình thay y = 10 => 2x - 5  = 100 => 2x = 100 + 5 = 105
        if (j !== i) sum -= coeffs[j] * x[j]
      }
      // Giá trị của ẩn  = vế phải chia cho hệ số của ẩn (105 / 2 = 57.5)
      xNew[i] = sum / coeffs[i]

      // Sau đó so sánh độ chênh lệch giữa 2 kết quả, nếu như độ lệch giữa kết quả ở vòng lặp hiện tại và vòng lặp lớn hơn độ sai số thì sẽ tiếp tục
      if (Math.abs(xNew[i] - x[i]) > tolerance) {
        converged = false
      }
    }

    // Nếu tất cả phương trình trong hệ phương trình đều hội tụ thì chấp
    if (converged) break
    x = [...xNew]
  }

  postMessage({ result: xNew })
}
