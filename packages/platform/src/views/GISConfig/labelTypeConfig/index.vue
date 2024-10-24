<template>
  <div class="standard-page">
    <div class="one-search">
      <el-form :model="query.params" @submit.prevent="query.querySearch">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="标签类型名称：">
              <el-autocomplete
                class="inline-input"
                v-model="query.params.name"
                :fetch-suggestions="querySearchName"
                placeholder="请输入..."
                :trigger-on-focus="false"
                @select="handleSelect"
                value-key="name"
                clearable
                @clear="query.querySearch"
              >
              </el-autocomplete>
            </el-form-item>
          </el-col>
          <el-col style="flex: 1; text-align: end">
            <el-button class="btn-search" @click="query.onClear"> <Icon src="RefreshLeft"></Icon> 重置 </el-button>
            <el-button class="btn-search" type="primary" @click="query.querySearch">
              <Icon src="Search"></Icon>
              搜索
            </el-button>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div class="table-card">
      <div class="option">
        <div class="title">标签类型配置</div>
        <div class="btn">
          <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_LABELTYPECONFIG_DELETE">
            <el-button @click="onDelete" :disabled="!table.ids.length"><Icon src="Delete"></Icon> 删除 </el-button>
          </Auth>
          <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_LABELTYPECONFIG_ADD">
            <el-button type="primary" @click="onAdd"><Icon src="Plus"></Icon> 创建 </el-button>
          </Auth>
          <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_LABELTYPECONFIG_IMPORT">
            <el-button type="primary" @click="onImport"><Icon src="UploadFilled"></Icon> 导入 </el-button>
          </Auth>
          <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_LABELTYPECONFIG_EXPORT">
            <el-button type="primary" @click.stop="onExport"><Icon src="Download"></Icon> 导出 </el-button>
          </Auth>
        </div>
      </div>
      <el-table
        :data="table.data"
        class="config-table"
        v-loading="table.loading"
        highlight-current-row
        empty-text="暂无数据"
        :row-style="{ height: 48 + 'px' }"
        :cell-style="{ padding: '0px' }"
        @sort-change="sortChange"
        @selection-change="table.onSelectionChange"
        border
      >
        <el-table-column type="selection"></el-table-column>
        <el-table-column label="序号" type="index" min-width="60"></el-table-column>
        <el-table-column label="标签类型编码" prop="code" sortable="custom" min-width="200"></el-table-column>
        <el-table-column label="标签类型名称" prop="name" sortable="custom" min-width="200"></el-table-column>
        <el-table-column label="所属图层" prop="layerConfigVO.name" sortable="custom" min-width="120"></el-table-column>
        <el-table-column label="数据类型" prop="dataTypeName" min-width="120"> </el-table-column>
        <el-table-column label="标签名称是否默认显示" prop="isDefaultDisplayLabelName" min-width="200">
          <template #default="scope">
            {{ scope.row.isDefaultDisplayLabelName ? "是" : "否" }}
          </template>
        </el-table-column>
        <el-table-column prop="path" label="操作" width="200" fixed="right" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button type="primary" link @click="table.onEdit(scope.row, 'detail')">
              {{ "详情" }}
            </el-button>
            <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_LABELTYPECONFIG_EDIT">
              <el-button type="primary" link @click="table.onEdit(scope.row, 'edit')">
                {{ "编辑" }}
              </el-button>
            </Auth>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty class="no-data" description="暂无数据" />
        </template>
      </el-table>
      <div class="pagination-container">
        <Pagination
          :total="table.total"
          v-model:page="query.params.pageNumber"
          v-model:limit="query.params.pageSize"
          @pagination="query.getPagination"
        ></Pagination>
      </div>
    </div>
    <LabelTypeEdit ref="labelTypeEditRef" @success-add="query.onQuery"></LabelTypeEdit>
    <DetailDialog ref="detailDialogRef" :constant="'GIS_LABEL_TYPE_DETAIL'" :title="'标签类型详情'" :width="900">
      <template #layerConfigId="scope">
        {{ scope.row.layerConfigVO?.name ? scope.row.layerConfigVO?.name : "" }}
      </template>
      <template #reference="scope">
        {{ displayReferenceInfo(scope.row) }}
      </template>
      <template #isDefaultDisplayLabelName="scope">
        {{ scope.row.isDefaultDisplayLabelName ? "是" : "否" }}
      </template>
      <template #isHang="scope">
        {{ scope.row.isHang ? "是" : "否" }}
      </template>
      <template #labelLegendImagePath="scope">
        {{ scope.row.labelLegendImagePath ? displayLabelLegendImage(scope.row) : "" }}
      </template>
      <template #dataType="scope">
        {{ LABEL_TYPE_DATA_TYPE[scope.row?.dataType as keyof typeof LABEL_TYPE_DATA_TYPE] }}
      </template>

      <!-- 点特有 -->
      <!-- 数据来源  点且有配置对象关联 -->
      <template #dataSource="scope">
        {{
          scope?.row?.dataType == "1" && scope?.row?.equipTypeId
            ? DATA_SOURCE[scope.row?.dataSource as keyof typeof DATA_SOURCE]
            : ""
        }}
      </template>

      <!-- 数据内容  点且数据来源是实时查询 -->
      <template #dataContent="scope">
        {{
          scope?.row?.dataType == "1" && scope?.row?.equipTypeId && scope.row?.dataSource == "dynamicQuery"
            ? (dataContentList?.find((item: any) => item?.attributeCode == scope.row?.dataContent) as any)?.attributeName
            : ""
        }}
      </template>
      <!-- 样式 -->
      <template #selectStyle="scope">
        {{ scope?.row?.dataType == "1" ? SELECT_STYLE[scope.row?.selectStyle as keyof typeof SELECT_STYLE] : "" }}
      </template>
      <!-- 样式对象 -->
      <template #styleObject="scope">
        {{
          scope?.row?.dataType == "1" && scope?.row?.selectStyle == "builtInStyle"
            ? STYLE_OBJECT[scope.row?.styleObject as keyof typeof STYLE_OBJECT]
            : ""
        }}
      </template>
      <!-- 显示比例 -->
      <template #displayScale="scope">
        {{ scope?.row?.dataType == "1" && scope?.row?.selectStyle == "customStyle" ? scope.row?.displayScale : "" }}
      </template>
      <!-- 标签类型图片 -->
      <template #labelTypeImagePath="scope">
        {{
          scope?.row?.dataType == "1" && scope?.row?.selectStyle == "customStyle"
            ? scope.row?.labelTypeImagePath
                .split(",")
                .map((item: any) => {
                  return (legendConfigList?.find((obj: any) => obj?.legendPath == item) as any)?.legendName;
                })
                ?.join("、")
            : ""
        }}
      </template>
      <!-- 轨迹设置 -->
      <template #isTrackSetting="scope">
        {{ scope?.row?.dataType == "1" ? (scope?.row?.isTrackSetting ? "是" : "否") : "" }}
      </template>
      <!-- 线宽(点（无轨迹设置时）及文本无) -->
      <template #lineWidth="scope">
        {{ scope?.row?.lineWidth ? scope?.row?.lineWidth : "" }}
      </template>
      <!-- 轨迹设置中的速度单位 -->
      <template #speedUnit="scope">
        {{ scope?.row?.dataType == "1" && scope?.row?.isTrackSetting ? scope?.row?.speedUnit : "" }}
      </template>
      <!-- 线型、线色（文本、点无） -->
      <template #lineColor="scope">
        <el-tag :color="scope.row.lineColor" class="w_30"></el-tag>
      </template>
      <template #lineType="scope">
        {{ scope?.row?.lineType ? LINE_TYPE[scope?.row?.lineType as keyof typeof LINE_TYPE] : "" }}
      </template>
      <!-- 动画设置（线环特有且为虚线时） -->
      <template #animationSetting="scope">
        {{ scope?.row?.animationSetting ? ANIMATION_SET[scope?.row?.animationSetting as keyof typeof ANIMATION_SET] : "无" }}
      </template>
      <!-- 面 圆 矩形特有 -->
      <template #polygonColor="scope">
        <el-tag :color="scope.row.polygonColor" class="w_30"></el-tag>
      </template>
      <!-- 文本特有 -->
      <template #content="scope">
        {{ scope?.row?.content ? scope?.row?.content : "" }}
      </template>
      <template #fontType="scope">
        {{ scope?.row?.fontType ? FONT_TYPE[scope?.row?.fontType as keyof typeof FONT_TYPE] : "" }}
      </template>
      <template #isBold="scope">
        {{ scope?.row?.isBold }}
      </template>
      <template #fontColor="scope">
        <el-tag :color="scope.row.fontColor" class="w_30"></el-tag>
      </template>
      <template #fontSize="scope">
        {{ scope?.row?.fontSize ? scope?.row?.fontSize : "" }}
      </template>
      <template #borderWidth="scope">
        {{ scope?.row?.borderWidth ? scope?.row?.borderWidth : "" }}
      </template>
      <template #borderColor="scope">
        <el-tag :color="scope.row.borderColor" class="w_30"></el-tag>
      </template>
      <template #backGroundColor="scope">
        <el-tag :color="scope.row.backGroundColor" class="w_30"></el-tag>
      </template>
    </DetailDialog>
    <UploadMainFileDialog
      ref="uploadMainFilRef"
      :fileTitle="'导入标签类型配置文件'"
      sceneCode="gisLabelType"
    ></UploadMainFileDialog>
  </div>
</template>

<script lang="ts" setup name="LabelTypeConfig">
import { onMounted, ref } from "vue";
import { MENU_BTNS_AUTH } from "@/components/auth/menuBtns";
import DetailDialog from "@/components/detailDialog/index.vue";
import UploadMainFileDialog from "../../../../../components/src/map/components/uploadFile/uploadMainFile.vue";
import { onExportExcel } from "../../../../../components/src/map/components/uploadFile/uploadFun";

import {
  getLabelTypeList,
  deleteLabelTypeCheck,
  deleteLabelType,
  getLabelTypeDetail,
  getLegendConfigList
} from "@/api/visconfig.js";
import { getBindAttributeMonitor } from "@/api/device.js";
import { handleParam } from "@/utils/common.js";
import {
  LABEL_TYPE_DATA_TYPE,
  DATA_SOURCE,
  SELECT_STYLE,
  STYLE_OBJECT,
  LINE_TYPE,
  FONT_TYPE,
  ANIMATION_SET
} from "@/constant/gisConstant";
import { ElMessage, ElMessageBox } from "element-plus";
import LabelTypeEdit from "./component/labelTypeEdit.vue";
import { TableList, SortChangeEvent } from "../type";

const labelTypeEditRef = ref<InstanceType<typeof LabelTypeEdit>>();
const detailDialogRef = ref<InstanceType<typeof DetailDialog>>();
const legendConfigList = ref([]); // 图例列表
const dataContentList = ref([]); // 数据内容列表

// 查询条件
const defaultParams = {
  name: "",
  orderByColumn: "",
  isAsc: "",
  pageNumber: 1,
  pageSize: 10
};

const query = ref({
  params: { ...defaultParams },
  getPagination: (obj: { [key: string]: any }) => {
    query.value.params.pageNumber = obj.page;
    query.value.params.pageSize = obj.limit;
    query.value.onQuery();
  },
  onClear: () => {
    query.value.params = { ...defaultParams };
    query.value.onQuery();
  },
  querySearch: () => {
    query.value.params.pageNumber = 1;
    query.value.onQuery();
  },
  onQuery: () => {
    table.value.getTableData();
  }
});

const table = ref<TableList>({
  loading: false,
  total: 0,
  ids: [],
  data: [],
  getTableData: async () => {
    table.value.loading = true;
    const res: { [key: string]: any } = await getLabelTypeList(...(handleParam(query.value.params) as [string, object]));
    if (res?.code == 200) {
      table.value.data = res?.data?.items || [];
      table.value.total = res?.data?.totalNum || 0;
    }
    table.value.loading = false;
  },
  onSelectionChange: (selection: any[]) => {
    table.value.ids = selection.map(item => item.id);
  },
  onEdit: async (row: { [key: string]: any }, type: string) => {
    if (type == "edit") {
      labelTypeEditRef.value?.openDialog(row);
    }
    if (type == "detail") {
      const res: { [key: string]: any } = await getLabelTypeDetail(row.id);
      if (res.code === 200 && res.data) {
        // 因为不是点时不显示样式（此时该字段有值，为了在详情弹框中无此项清空该值）
        if (res.data?.dataType != "1" && res.data?.selectStyle) {
          res.data.selectStyle = "";
        }
        if (res.data?.dataType != "1" || !res.data?.equipTypeId) {
          res.data.dataSource = "";
        }
        if (res.data?.dataType != "1" || res.data?.selectStyle != "customStyle") {
          // 只有点且样式是自定义才显示比例及标签类型图片
          res.data.displayScale = "";
          res.data.labelTypeImagePath = "";
        }
        if (res.data?.dataType != "1" || res.data?.dataSource != "dynamicQuery") {
          // 点且实时查询时才显示 数据内容
          res.data.dataContent = "";
        }
        if ((res.data?.dataType == "1" && !res.data?.isTrackSetting) || res.data?.dataType == "6") {
          // 点且没有轨迹设置、文本时清除显示线宽
          res.data.lineWidth = "";
          res.data.speedUnit = "";
        }
        if (res.data?.dataType != "1") {
          res.data.speedUnit = "";
        }
        if (["1", "6"]?.includes(res.data?.dataType)) {
          // 点、文本无线型、线色
          res.data.lineType = "";
          res.data.lineColor = "";
        }
        if (!["2"]?.includes(res.data?.dataType)) {
          // 线特有的
          res.data.lineVectorPath = "";
          res.data.lineVectorWidth = "";
          res.data.lineVectorHeight = "";
          res.data.lineVectorProportion = "";
        } else {
          // 线不管配没配矢量相关的都展示这些字段
          if (!res.data.lineVectorPath) {
            res.data.lineVectorPath = " ";
          }
          if (!res.data.lineVectorWidth) {
            res.data.lineVectorWidth = " ";
          }
          if (!res.data.lineVectorHeight) {
            res.data.lineVectorHeight = " ";
          }
          if (!res.data.lineVectorProportion) {
            res.data.lineVectorProportion = " ";
          }
        }
        if (!["2", "7"].includes(res.data?.dataType) || res.data?.lineType != "dash") {
          // 动画设置（线、环且线型是虚线）特有
          res.data.animationSetting = "";
        }
        if (!["3", "4", "5"].includes(res.data?.dataType)) {
          // 面 圆 矩形特有
          res.data.polygonColor = "";
        }
        if (!["6"].includes(res.data?.dataType)) {
          // 文本特有
          res.data.content = "";
          res.data.fontType = "";
          res.data.isBold = "";
          res.data.fontColor = "";
          res.data.fontSize = "";
          res.data.borderWidth = "";
          res.data.borderColor = "";
          res.data.backGroundColor = "";
        } else {
          if (res.data.isBold) {
            res.data.isBold = "是";
          } else {
            res.data.isBold = "否";
          }
        }
        res.data.layerConfigVO = row?.layerConfigVO;
        detailDialogRef.value?.openDialog({ ...res.data } || {});
      }
      // 图例列表
      const resLegend: { [key: string]: any } = await getLegendConfigList("?pageSize=10000&pageNumber=1", {});
      legendConfigList.value = resLegend?.data?.items || [];

      // 数据内容(是点 有绑定关联关系 是动态查询才去请求)
      if (res.data?.dataType == "1" && res.data?.equipTypeId && res.data?.dataSource == "dynamicQuery") {
        const dataContentRes: { [key: string]: any } = await getBindAttributeMonitor(
          res.data?.equipType?.id,
          !!res.data?.reference.includes("VisitObject")
        ); // 传设备类型id
        dataContentList.value = dataContentRes?.data || [];
      }
    }
  }
});

const onAdd = () => {
  labelTypeEditRef.value?.openDialog();
};

const sortChange = (val: SortChangeEvent) => {
  query.value.params.orderByColumn = val.prop;
  const orderMap: { [key: string]: string } = {
    descending: "desc",
    ascending: "asc"
  };
  query.value.params.isAsc = orderMap[val.order];
  table.value.getTableData();
};

const uploadMainFilRef = ref<InstanceType<typeof UploadMainFileDialog>>();

const onImport = () => {
  uploadMainFilRef.value?.openDialog();
};

const onExport = async () => {
  const formData = new FormData();
  formData.append("sceneCode", "gisLabelType");
  formData.append("queryStr", JSON.stringify({ gisLabelConfigVO: { name: query.value.params.name || "" } }));
  onExportExcel(formData, "gisLabelTypeExport");
};

const onDelete = async () => {
  const res: { [key: string]: any } = await deleteLabelTypeCheck(table.value.ids);
  if (res.code == 200) {
    if (res.data?.length == 0) {
      ElMessageBox.confirm("删除该配置可能会导致GIS地图展示异常，请慎重！确定删除？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(async () => {
          table.value.loading = true;
          const res: { [key: string]: any } = await deleteLabelType(table.value.ids);
          if (res.code == 200) {
            ElMessage.success("删除成功");
            table.value.getTableData();
          }
        })
        .catch(() => {});
    } else {
      ElMessage({
        dangerouslyUseHTMLString: true,
        message: res.data.filter((item: any) => item.length).join("<br/>"),
        type: "error"
      });
    }
  }
  table.value.loading = false;
};

const querySearchName: (queryString: string, cb: (arg: any) => void) => void = async (
  queryString: string,
  cb: (arg: any) => void
) => {
  const res: { [key: string]: any } = await getLabelTypeList("?pageSize=10000&pageNumber=1", { name: queryString });
  cb(res.data.items);
};

const handleSelect = async () => {
  query.value.querySearch();
};

onMounted(() => {
  table.value.getTableData();
});

// 标签类型详情模块
//  对象关联配置
const displayReferenceInfo = (form: { [key: string]: any }) => {
  if (form?.equipType && form?.equipTypeId) {
    if (form?.attribute && form?.attributeId) {
      const referenceValue = JSON.parse(form?.referenceValue); // 有属性值时才有该字段JSON格式
      const { type, selectedValue } = referenceValue;
      let attributeValue = selectedValue;
      if (type === "select") {
        attributeValue = selectedValue.label;
      }
      return `${form?.equipType?.name} - ${form?.attribute?.label || form?.attribute?.name} - ${attributeValue}`;
    } else {
      return `${form?.equipType?.name}`;
    }
  } else {
    return "";
  }
};

// 图例
const displayLabelLegendImage = (row: { [key: string]: any }) => {
  let legendObj: any = legendConfigList.value?.find((item: any) => {
    return `${item?.legendPath}` == `${row?.labelLegendImagePath}`;
  });
  return legendObj?.legendName;
};
</script>

<style lang="scss" scoped>
.w_30 {
  width: 30px;
}
</style>
