import { SHA256 } from "crypto-js";
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
    const reader = new FileReader();
    reader.onload = function (event: any) {
      // 文件读取完成后触发
      const buffer = event?.target?.result;
      const hashHex = SHA256(buffer)?.toString(); // 计算 SHA-256 哈希值
      resolve(hashHex);
    };
    reader.onerror = function (error) {
      reject(error);
    };
    reader.readAsArrayBuffer(file); // 读取文件
  });
}

export const progressStatus = {
  ready: "准备中",
  uploading: "上传中",
  uploadFail: "上传失败，请重新上传",
  uploadSuccess: "上传成功，解压中"
};
