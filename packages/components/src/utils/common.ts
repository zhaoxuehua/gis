// 拼接url的string
export function getQueryString(param: any) {
  let str = "?";
  for (let key in param) {
    if (param[key] || param[key]?.toString() == "0") {
      str += `${key}=${param[key]}&`;
    }
  }
  return str.slice(0, -1);
}

// 处理搜索参数
export function handleParam(query: any) {
  let params = { ...query };
  let queryString = getQueryString({
    pageSize: params.pageSize,
    pageNumber: params.pageNumber,
    orderByColumn: params.orderByColumn,
    isAsc: params.isAsc
  });
  delete params.pageSize;
  delete params.pageNumber;
  delete params.orderByColumn;
  delete params.isAsc;
  return [queryString, params];
}
