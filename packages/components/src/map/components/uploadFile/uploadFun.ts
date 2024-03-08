import { ref } from "vue";
import { ElMessage } from "element-plus";
import { read, utils, writeFileXLSX } from "xlsx";

const useExportExcel = (excelData: string, fileName: string) => {
  const wb = read(excelData);
  const ws = wb.Sheets[wb.SheetNames[0]];
  // 从工作表生成数据行
  const data = utils.sheet_to_json(ws);
  // 从对象数组创建工作表
  const worksheet = utils.json_to_sheet(data);
  // 创建新工作簿
  const workbook = utils.book_new();
  // 工作表加到工作簿
  utils.book_append_sheet(workbook, worksheet);
  writeFileXLSX(workbook, fileName);
};

// 进度实现要求：导入时间超过2秒出现进度条，显示进度给一个假的，进度先按一定的速率更新，比如10秒从0-80%，如果时间更久则从80%-99降低进度条的更新速率
const timer1: any = ref(null);
const timer2: any = ref(null);

const clearTimer = () => {
  if (timer1.value) {
    clearTimeout(timer1.value);
  }
  if (timer2.value) {
    clearInterval(timer2.value);
  }
};

const showProgressFun = (state: any) => {
  state.isProcessing = true;
  state.loading = true;
  clearTimer();
  timer1.value = setTimeout(() => {
    processCountFun(state);
  }, 2000);
};

const processCountFun = (state: any) => {
  state.isShowLoadingProgress = true;
  let progressCount = 0;
  state.progressCount = progressCount;
  clearTimer();
  timer2.value = setInterval(() => {
    progressCount += 10;
    if (progressCount < 80) {
      state.progressCount = progressCount;
    } else {
      state.progressCount = 80 + (progressCount - 80) / 2; // 降低速率
    }

    if (progressCount >= 99) {
      state.progressCount = 99;
      clearTimer();
    }
  }, 1000);
};

const closeLoadingProgress = (state: any) => {
  clearTimer();
  state.progressCount = 0;
  state.loading = false;
  state.isShowLoadingProgress = false;
  state.isProcessing = false;
};

const beforeUploadFun = (file: any, accept: any, size: number, callback?: Function) => {
  let arr = file?.name?.split(".");
  if (!accept?.includes(arr[arr?.length - 1])) {
    ElMessage.warning(`只能上传${accept?.[0]}格式!`);
    return false;
  } else if (file.size / 1024 / 1024 > size) {
    ElMessage.warning(`单个文件大小不能超过${size}M!`);
    return false;
  }
  callback && callback();
  return true;
};

const downloadFun = (url: string, downloadFileName: string) => {
  const downloadLink = document.createElement("a");
  downloadLink.style.display = "none";
  downloadLink.download = downloadFileName;
  downloadLink.href = url;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  window.URL.revokeObjectURL(url);
};

const fileNameMap: { [key: string]: string } = {
  gisLabel: "标签信息模板.xlsx",
  gisTree: "设备信息模板.xlsx",
  gisLabelType: "标签类型信息模板.xlsx",

  gisLabelExport: "标签信息.xlsx",
  gisTreeExport: "设备信息.xlsx",
  gisLabelTypeExport: "标签类型信息.xlsx"
};

const exportSuccessTipMap: { [key: string]: string } = {
  gisLabel: "标签信息配置表格",
  gisTree: "设备信息配置表格",
  gisLabelType: "标签类型配置表格"
};

export {
  clearTimer,
  showProgressFun,
  processCountFun,
  closeLoadingProgress,
  beforeUploadFun,
  downloadFun,
  fileNameMap,
  useExportExcel,
  exportSuccessTipMap
};
