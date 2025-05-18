// Jacobi method inside Web Worker
onmessage = function (e) {
  const { equations, tolerance = 1e-8, maxIter = 1000 } = e.data;
  const n = equations.length;
  let x = new Array(n).fill(0);
  let xNew = [...x];
  let converged = false;

  for (let iter = 0; iter < maxIter; iter++) {
    converged = true;
    for (let i = 0; i < n; i++) {
      const { coeffs, constant } = equations[i];
      let sum = constant;
      for (let j = 0; j < n; j++) {
        if (j !== i) sum -= coeffs[j] * x[j];
      }
      xNew[i] = sum / coeffs[i];

      if (Math.abs(xNew[i] - x[i]) > tolerance) {
        converged = false;
      }
    }

    if (converged) break;
    x = [...xNew];
  }

  postMessage({ result: xNew });
};
