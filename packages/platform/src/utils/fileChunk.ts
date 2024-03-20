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

export function getFileUniqueHash(file: File) {
  return new Promise<string>((resolve, reject) => {
    const chunkSize = 1024 * 1024 * 1024; // 1 GB
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const hashArray: string[] = [];

    const reader = new FileReader();

    reader.onload = function (event: any) {
      const buffer = event?.target?.result;
      const hashHex = SHA256(buffer)?.toString();
      hashArray.push(hashHex);

      currentChunk++;

      if (currentChunk < chunks) {
        loadNextChunk();
      } else {
        const finalHashHex = SHA256(hashArray?.join(""))?.toString();
        resolve(finalHashHex);
      }
    };

    reader.onerror = function (error) {
      reject(error);
    };

    function loadNextChunk() {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);

      const slice = file?.slice(start, end);
      reader.readAsArrayBuffer(slice);
    }

    loadNextChunk();
  });
}

// 跟后端一致计算hash值且分片计算的方法，太慢
// export function getFileUniqueHash(file: any) {
//   return new Promise((resolve, reject) => {
//     const chunkSize = 10 * 1024 * 1024; // 10MB
//     const chunks = Math.ceil(file.size / chunkSize);
//     let currentChunk = 0;
//     const hash = algo.SHA256.create(); // 初始化 SHA256 对象
//     const reader = new FileReader();

//     reader.onload = function (event: any) {
//       hash?.update(lib.WordArray?.create(event?.target?.result));
//       currentChunk++;

//       if (currentChunk < chunks) {
//         loadNextChunk();
//       } else {
//         const hashHex = hash?.finalize()?.toString(enc.Hex); // 16进制hash值
//         resolve(hashHex);
//       }
//     };

//     reader.onerror = function (error) {
//       reject(error);
//     };

//     const loadNextChunk = () => {
//       const start = currentChunk * chunkSize;
//       const end = Math.min(start + chunkSize, file.size);
//       const slice = file?.slice(start, end);
//       reader.readAsArrayBuffer(slice);
//     };

//     loadNextChunk();
//   });
// }

export const progressStatus = {
  ready: "准备中",
  uploading: "上传中",
  uploadFail: "上传失败，请重新上传",
  uploadSuccess: "上传成功，解压中",
  decompressionFail: "解压失败"
};

interface ProgressType {
  normalUrl: string;
  sateUrl: string;
  overlayUrl: string;
  [key: string]: string; // 添加索引签名
}

export const progressLabel: ProgressType = {
  normalUrl: "电子地图进度",
  sateUrl: "卫星地图进度",
  overlayUrl: "路网叠加层进度"
};

export const progressDialogTitle: ProgressType = {
  normalUrl: "电子地图上传进度",
  sateUrl: "卫星地图上传进度",
  overlayUrl: "路网叠加层上传进度"
};
