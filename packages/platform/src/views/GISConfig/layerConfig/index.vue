<template>
  <div class="standard-page">
    <div class="one-search">
      <el-form :model="query.params" @submit.prevent="query.querySearch">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="图层名称：">
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
        <div class="title">图层配置</div>
        <div class="btn">
          <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_LAYERCONFIG_DELETE">
            <el-button @click="onDelete" :disabled="!table.ids.length"><Icon src="Delete"></Icon>{{ "删除" }}</el-button>
          </Auth>
          <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_LAYERCONFIG_ADD">
            <el-button type="primary" @click="onAdd"><Icon src="Plus"></Icon>{{ "创建" }}</el-button>
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
        <el-table-column label="序号" type="index" width="60"></el-table-column>
        <el-table-column label="图层编码" prop="code" sortable="custom" min-width="120"></el-table-column>
        <el-table-column label="图层名称" prop="name" sortable="custom" min-width="120"></el-table-column>
        <el-table-column label="默认显示层级" prop="layerLevel" sortable="custom" min-width="130"></el-table-column>
        <el-table-column label="最低显示层级" prop="layerMinLevel" sortable="custom" min-width="130"></el-table-column>
        <el-table-column label="最高显示层级" prop="layerMaxLevel" sortable="custom" min-width="130"></el-table-column>
        <el-table-column label="创建时间" prop="createdOn" sortable="custom" min-width="200">
          <template #default="scope">
            {{ scope.row?.createdOn ? moment(scope.row?.createdOn).format("YYYY-MM-DD HH:mm:ss") : "" }}
          </template>
        </el-table-column>
        <el-table-column prop="path" label="操作" width="200" fixed="right" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button type="primary" link plain @click="table.onEdit(scope.row, 'detail')">
              {{ "详情" }}
            </el-button>
            <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_LAYERCONFIG_EDIT">
              <el-button type="primary" link @click="table.onEdit(scope.row, 'edit')">
                {{ "编辑" }}
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

    <LayerEdit ref="layerEditRef" @success-add="query.onQuery"></LayerEdit>
    <DetailDialog ref="detailDialogRef" :constant="'GIS_LAYER_DETAIL'" :title="'图层详情'">
      <template #isTagAgg="scope">
        {{ scope.row?.isTagAgg ? "是" : "否" }}
      </template>
      <template #tagAggDistance="scope">
        {{ scope.row?.tagAggDistance ? `${scope.row?.tagAggDistance}px` : "" }}
      </template>
      <template #isTrackDraw="scope">
        {{ scope.row?.isTrackDraw ? "是" : "否" }}
      </template>
      <template #trackAggDistance="scope">
        {{ scope.row?.trackAggDistance ? `${scope.row?.trackAggDistance}px` : "" }}
      </template>
    </DetailDialog>
  </div>
</template>

<script setup lang="ts" name="LayerConfig">
import { onMounted, ref } from "vue";
import moment from "moment";
import { MENU_BTNS_AUTH } from "@/components/auth/menuBtns";
import { getLayerList, deleteLayerCheck, deleteLayer } from "@/api/visconfig.js";
import { handleParam } from "@/utils/common.js";
import { ElMessage, ElMessageBox } from "element-plus";
import DetailDialog from "@/components/detailDialog/index.vue";
import LayerEdit from "./component/layerEdit.vue";
import { TableList, SortChangeEvent } from "../type";

interface OrderMap {
  [key: string]: string;
}
const layerEditRef = ref<InstanceType<typeof LayerEdit>>();
const detailDialogRef = ref<InstanceType<typeof DetailDialog>>();

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
    query.value.params.name = "";
    query.value.params.pageNumber = 1;
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
    const res: { [key: string]: any } = await getLayerList(...(handleParam(query.value.params) as [string, object]));
    if (res?.code == 200) {
      table.value.data = res?.data?.items || [];
      table.value.total = res?.data?.totalNum || 0;
    }
    table.value.loading = false;
  },
  onSelectionChange: (selection: any[]) => {
    table.value.ids = selection?.map((item: { [key: string]: any }) => item.id);
  },
  onEdit: (row: { [key: string]: any }, type: string) => {
    if (type == "edit") {
      layerEditRef.value?.openDialog(row);
    } else if (type == "detail") {
      detailDialogRef.value?.openDialog(row);
    }
  }
});

const onAdd = () => {
  layerEditRef.value?.openDialog();
};

const sortChange = (val: SortChangeEvent) => {
  query.value.params.orderByColumn = val.prop;
  const orderMap: OrderMap = {
    descending: "desc",
    ascending: "asc"
  };
  query.value.params.isAsc = orderMap[val.order];
  table.value.getTableData();
};

const onDelete = async () => {
  const res: { [key: string]: any } = await deleteLayerCheck(table.value.ids);
  if (res.code == 200) {
    if (res.data?.length == 0) {
      ElMessageBox.confirm("删除该配置可能会导致GIS地图展示异常，请慎重！确定删除？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(async () => {
          table.value.loading = true;
          const res: { [key: string]: any } = await deleteLayer(table.value.ids);
          if (res?.code == 200) {
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
  const res: { [key: string]: any } = await getLayerList("?pageSize=10000&pageNumber=1", { name: queryString });
  cb(res.data.items);
};

const handleSelect = async () => {
  query.value.querySearch();
};

onMounted(() => {
  table.value.getTableData();
});
</script>

<style lang="scss" scoped></style>
