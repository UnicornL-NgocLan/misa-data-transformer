export function solveJacobiSystemInWorker(equations) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/jacobi.worker.js', import.meta.url)
    )
    worker.postMessage({ equations })

    worker.onmessage = function (e) {
      resolve(e.data.result)
      worker.terminate()
    }

    worker.onerror = function (err) {
      reject(err)
      worker.terminate()
    }
  })
}
