/*
  动态计算分片大小
  fileSize:文件大小
  maxChunks：最大文件数量
  minChunkSize：最小分片大小
*/
export function calculateChunkSize(fileSize: number, maxChunks: number, minChunkSize: number) {
  let chunkSize = Math.min(minChunkSize, fileSize); // 最小分片大小不得小于 minChunkSize
  let calculatedChunks = Math.ceil(fileSize / chunkSize); // 计算分片数量
  // 如果分片数量超过最大限制，且分片大小不小于 minChunkSize，则逐步增大分片大小
  while (calculatedChunks > maxChunks && chunkSize >= minChunkSize) {
    chunkSize = Math.min(chunkSize * 2, fileSize); // 将分片大小翻倍，但不超过文件大小
    calculatedChunks = Math.ceil(fileSize / chunkSize);
  }
  return chunkSize;
}

/*
  分片函数（将文件分片）
  file:文件
  chunkSize：分片大小
*/
export function splitFile(file: any, chunkSize: number) {
  const chunks = [];
  let startByte = 0;
  let endByte = chunkSize;
  while (startByte < file.size) {
    const chunk = file?.slice(startByte, endByte);
    const newFile = new File([chunk], file.name);
    chunks.push(newFile);
    startByte += chunkSize;
    endByte += chunkSize;
  }
  return chunks;
}

/*
  计算文件的hash值
  file:文件
*/
export function getFileUniqueHash(file: any) {
  return new Promise((resolve, reject) => {
    file
      ?.arrayBuffer()
      .then(function (buffer: any) {
        return crypto.subtle.digest("SHA-256", buffer);
      })
      .then(function (hash: any) {
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray?.map(byte => byte?.toString(16)?.padStart(2, "0"))?.join("");
        resolve(hashHex);
      })
      .catch(function (error: any) {
        reject(error);
      });
  });
}
