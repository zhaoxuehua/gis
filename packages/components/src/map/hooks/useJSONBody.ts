import { reactive, toRefs } from "vue";
import { labelDetailAttr } from "../../api/device";

export const useJSONBody = () => {
  const state = reactive({
    tableBodyData: [] as any,
    configInfo: {} as any,
    monitorLineAttr: [] as any, //监测线性属性code
    monitorJSONbodyMap: {},
    staticAttr: [] as any,
    monitorSeqAttr: [] as any,
    linkData: [] as any
  });

  const getDiffAttrCode = () => {
    // 散点类型
    const sequenceType = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // 线性类型
    const lineType = [91, 92, 93];
    let staticAttr = state.configInfo.staticAttribute.map((item: any) => item.attributeCode);
    let monitorSeqAttr: string[] = [];
    let monitorLineAttr: string[] = [];
    let monitorJSONbodyMap: any = {};
    state.configInfo.monitorAttribute.forEach((item: any) => {
      if (lineType.includes(Number(item.attributeType))) {
        monitorLineAttr.push(item.attributeCode);
      }
      if (sequenceType.includes(Number(item.attributeType))) {
        monitorSeqAttr.push(item.attributeCode);
      }
      if ([10].includes(Number(item.attributeType))) {
        monitorJSONbodyMap[item.attributeCode] = item.attributeJsonConfig;
      }
    });
    return {
      staticAttr,
      monitorSeqAttr,
      monitorLineAttr,
      monitorJSONbodyMap
    };
  };
  /**
   * 获取绑定的属性
   * @param param0 equipType  设备类型id   isVisitObject   是否是外部对象
   * @returns
   */
  const getBindAttr = async ({ equipType, isVisitObject }: any) => {
    // 设备类别 EquipCategory  设备类型 EquipType  外部设备类型 VisitObjectType
    const currentType = isVisitObject ? "VisitObjectType" : "EquipType";
    // 获取配置的绑定属性
    const detailRes: any = await labelDetailAttr(equipType, currentType);
    if (detailRes.code !== 200) return;
    state.configInfo = detailRes.data;
    state.linkData = state.configInfo?.linkConfig || [];

    // 获取不同属性的code
    const { monitorJSONbodyMap, staticAttr, monitorSeqAttr, monitorLineAttr } = getDiffAttrCode();
    state.monitorJSONbodyMap = monitorJSONbodyMap;
    state.staticAttr = staticAttr;
    state.monitorSeqAttr = monitorSeqAttr;
    state.monitorLineAttr = monitorLineAttr;
  };

  /**
   * 根据绑定属性和数据 匹配数据的字段含义
   * @param jsonbodyData   数据格式 参考 ../components/popup/popupmock
  * [{
  *  name: "属性名",
      code: "属性code",
      value: "数据"
  * }]
   * @param jsonbodyMap   数据格式  参考 ../components/popup/popupmock
   * {
   *    属性code: 配置的结构体
   * }
   */
  const handleBodyValue = (jsonbodyData: any[], jsonbodyMap: any) => {
    state.tableBodyData = [];
    jsonbodyData?.forEach((item: any) => {
      try {
        item.value = JSON.parse(item.value);
      } catch (error) {
        item.value = "";
      }
      let fieldList = jsonbodyMap?.[item.code][0]?.children;
      let tableColumn = fieldList?.map((val: any) => {
        return {
          prop: val.field,
          label: val.remark
        };
      });
      let tableBodyItem = {
        tile: jsonbodyMap?.[item.code][0]?.tile,
        name: item.name,
        code: item.code,
        columns: tableColumn,
        data: Array.isArray(item.value) ? item.value : item.value ? [item.value] : [],
        pagination: {
          total: 0,
          page: 1,
          pageSize: 5
        },
        pageData: null,
        currentDescIndex: 0
      };
      tableBodyItem.pagination.total = tableBodyItem.data.length;
      tableBodyItem.pageData = tableBodyItem.data.slice(
        (tableBodyItem.pagination.page - 1) * tableBodyItem.pagination.pageSize,
        tableBodyItem.pagination.page * tableBodyItem.pagination.pageSize
      );
      state.tableBodyData.push(tableBodyItem);
      console.log(state.tableBodyData);
    });
  };

  return {
    ...toRefs(state),
    handleBodyValue,
    getBindAttr
  };
};
