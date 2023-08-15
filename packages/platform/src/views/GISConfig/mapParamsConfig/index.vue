<template>
  <div class="standard-page">
    <div class="one-search">
      <el-form :model="query.params">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="场景名称：">
              <el-autocomplete
                class="inline-input"
                v-model="query.params.appName"
                :fetch-suggestions="querySearch"
                placeholder="请输入..."
                :trigger-on-focus="false"
                @select="handleSelect"
                value-key="appName"
                clearable
                @clear="query.onQuery"
              >
              </el-autocomplete>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-button class="btn-search" type="primary" @click="query.onQuery">
              <Icon src="Search"></Icon>
              搜索
            </el-button>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div class="table-card">
      <div class="option">
        <div class="title">应用场景配置</div>
        <div class="btn">
          <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_MAPPARAMSCONFIG_DELETE">
            <el-button @click="onDelete" :disabled="!table.ids.length"><Icon src="Delete"></Icon>{{ "删除" }}</el-button>
          </Auth>
          <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_MAPPARAMSCONFIG_ADD">
            <el-button type="primary" @click="onAdd"> <Icon src="Plus"></Icon>{{ "创建" }} </el-button>
          </Auth>
        </div>
      </div>
      <el-table
        :data="table.data"
        class="config-table"
        v-loading="table.loading"
        highlight-current-row
        empty-text="暂无数据"
        :row-style="{ height: 32 + 'px' }"
        :cell-style="{ padding: '0px' }"
        @sort-change="sortChange"
        @selection-change="table.onSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection"></el-table-column>
        <el-table-column label="序号" type="index" min-width="60"></el-table-column>
        <el-table-column label="场景编码" prop="appCode" min-width="120" sortable="custom"></el-table-column>
        <el-table-column label="场景名称" prop="appName" min-width="120" sortable="custom"></el-table-column>
        <el-table-column label="显示模式" prop="displayMode" min-width="120" sortable="custom">
          <template #default="scope">
            {{ scope.row.displayMode == 1 ? "电子地图" : "卫星影像" }}
          </template>
        </el-table-column>
        <el-table-column label="默认展示层级" prop="defaultDisplayLevel" sortable="custom" min-width="150"></el-table-column>
        <el-table-column label="最低层级" prop="minLevel" sortable="custom" min-width="120"></el-table-column>
        <el-table-column label="最高层级" prop="maxLevel" sortable="custom" min-width="120"></el-table-column>
        <el-table-column label="中心点纬度" prop="defaultCenterPointLatitude" sortable="custom" min-width="150"></el-table-column>
        <el-table-column
          label="中心点经度"
          prop="defaultCenterPointLongitude"
          sortable="custom"
          min-width="150"
        ></el-table-column>
        <el-table-column prop="path" label="操作" width="200" fixed="right" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button type="primary" link @click="table.onEdit(scope.row, 'detail')">
              {{ "详情" }}
            </el-button>
            <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_MAPPARAMSCONFIG_EDIT">
              <el-button type="primary" link @click="table.onEdit(scope.row, 'edit')">
                {{ "编辑" }}
              </el-button>
            </Auth>
            <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_MAPPARAMSCONFIG_MAP">
              <el-button type="primary" link @click="table.onEdit(scope.row, 'map')">
                {{ "地图" }}
              </el-button>
            </Auth>
          </template>
        </el-table-column>
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

    <MapParamsEdit ref="mapParamsEditRef" @success-add="query.onQuery"></MapParamsEdit>

    <DetailDialog ref="detailDialogRef" :constant="'GIS_MAPPARAMS_DETAIL'" :title="'应用场景详情'" :width="900">
      <template #displayMode="scope">
        {{ scope.row.displayMode == 1 ? "电子地图" : "卫星影像" }}
      </template>
      <template #displayLabelInfoIds="scope">
        {{ scope.row.displayLabelInfo?.map((item: any) => item.name).join(",") }}
      </template>
      <template #displayLayerIds="scope">
        {{ scope.row.displayLayer?.map((item: any) => item?.name).join(",") }}
      </template>
      <template #displayControlIds="scope">
        {{ displayDisplayControlIds(scope.row.displayControlIds) }}
      </template>
      <template #displayLegend="scope">
        {{ scope.row.displayLegend?.map((item: any) => item?.legendName).join(",") }}
      </template>
      <template #isEdit="scope">
        {{ scope.row.isEdit ? "是" : "否" }}
      </template>
    </DetailDialog>
  </div>
</template>

<script lang="ts" setup name="LayerConfig">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { GIS_CONTROLS } from "@/constant/gisConstant";
import { MENU_BTNS_AUTH } from "@/components/auth/menuBtns";
import { getMapParamsList, deleteMapParamsCheck, deleteMapParams, getMapParamsDetail } from "@/api/visconfig.js";
import { handleParam } from "@/utils/common.js";
import { ElMessage, ElMessageBox } from "element-plus";
import DetailDialog from "@/components/detailDialog/index.vue";
import MapParamsEdit from "./component/mapParamsEdit.vue";
import { TableList, SortChangeEvent } from "../type";

const router = useRouter();
const mapParamsEditRef = ref<InstanceType<typeof MapParamsEdit>>();
const detailDialogRef = ref<InstanceType<typeof DetailDialog>>();

// 查询条件
const defaultParams = {
  appName: "",
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
    const res: { [key: string]: any } = await getMapParamsList(...(handleParam(query.value.params) as [string, object]));
    if (res.data.items) {
      table.value.data = res.data.items;
      table.value.total = res.data.totalNum;
    } else {
      ElMessage.error("接口异常");
    }
    table.value.loading = false;
  },
  onSelectionChange: (selection: any[]) => {
    table.value.ids = selection?.map((item: { [key: string]: any }) => item.id);
  },
  onEdit: async (row: { [key: string]: any }, type: string) => {
    if (type == "edit") {
      mapParamsEditRef.value?.openDialog(row);
    } else if (type == "detail") {
      const res: { [key: string]: any } = await getMapParamsDetail(row.id);
      if (res.code === 200 && res.data) {
        const data = JSON.parse(JSON.stringify(res.data));
        detailDialogRef.value?.openDialog(data);
      } else {
        ElMessage.error("接口异常");
      }
    } else if (type == "map") {
      // 地图编辑页
      let path = "/map/mapView";
      const routeUrl = router.resolve({
        path,
        query: {
          id: row?.id
        }
      });
      window.open(routeUrl.href, "_blank");
    }
  }
});

const onAdd = () => {
  mapParamsEditRef.value?.openDialog();
};

const sortChange = (val: SortChangeEvent) => {
  query.value.params.orderByColumn = val.prop;
  const orderMap: {
    [key: string]: string;
  } = {
    descending: "desc",
    ascending: "asc"
  };
  query.value.params.isAsc = orderMap[val.order];
  table.value.getTableData();
};

const onDelete = async () => {
  const res: { [key: string]: any } = await deleteMapParamsCheck(table.value.ids);
  if (res.code == 200) {
    if (res.data?.length == 0) {
      ElMessageBox.confirm("删除该配置可能会导致GIS地图展示异常，请慎重！确定删除?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(async () => {
          table.value.loading = true;
          const res: { [key: string]: any } = await deleteMapParams(table.value.ids);
          if (res.code == 200) {
            ElMessage.success("删除成功");
            table.value.getTableData();
          } else {
            ElMessage.error(res.msg);
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
  } else {
    ElMessage.error(res.msg);
  }
  table.value.loading = false;
};

const querySearch: (queryString: string, cb: (arg: any) => void) => void = async (
  queryString: string,
  cb: (arg: any) => void
) => {
  let oldPageSize = query.value.params.pageSize;
  query.value.params.appName = queryString;
  query.value.params.pageSize = 10000;
  query.value.params.pageNumber = 1;
  const res: { [key: string]: any } = await getMapParamsList(...(handleParam(query.value.params) as [string, object]));
  // 调用 callback 返回建议列表的数据
  cb(res.data.items);
  query.value.params.pageSize = oldPageSize;
};

const handleSelect = async () => {
  table.value.loading = true;
  const res: { [key: string]: any } = await getMapParamsList(...(handleParam(query.value.params) as [string, object]));
  table.value.data = res.data.items;
  table.value.total = res.data.totalNum;
  table.value.loading = false;
};

const displayDisplayControlIds = (controlIds: string | null) => {
  if (controlIds) {
    let controlIdsArr: any = controlIds.split(",");
    controlIdsArr = controlIdsArr.map((code: string) => {
      let obj = GIS_CONTROLS.find((item: { [key: string]: any }) => item.code == code);
      return obj?.name;
    });
    return controlIdsArr.join(",");
  }
  return "";
};

onMounted(() => {
  table.value.getTableData();
});
</script>

<style lang="scss" scoped></style>
