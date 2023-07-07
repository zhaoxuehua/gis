<template>
  <div class="label-type-config">
    <div class="one-search">
      <el-form :model="query.params">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="标签类型名称：">
              <el-autocomplete
                class="inline-input"
                v-model="query.params.name"
                :fetch-suggestions="querySearch"
                placeholder="请输入..."
                :trigger-on-focus="false"
                @select="handleSelect"
                value-key="name"
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

    <div class="option">
      <div class="title">标签类型配置</div>
      <div class="btn">
        <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_LABELTYPECONFIG_DELETE">
          <el-button @click="onDelete" :disabled="!table.ids.length"><Icon src="Delete"></Icon>{{ "删除" }}</el-button>
        </Auth>
        <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_LABELTYPECONFIG_ADD">
          <el-button type="primary" @click="onAdd"><Icon src="Plus"></Icon>{{ "创建" }}</el-button>
        </Auth>
      </div>
    </div>
    <el-table
      :data="table.data"
      class="label-type-config-table"
      v-loading="table.loading"
      highlight-current-row
      empty-text="暂无数据"
      :row-style="{ height: 32 + 'px' }"
      :cell-style="{ padding: '0px' }"
      @sort-change="sortChange"
      @selection-change="table.onSelectionChange"
    >
      <el-table-column type="selection"></el-table-column>
      <el-table-column label="序号" type="index" width="50"></el-table-column>
      <el-table-column label="标签类型编码" prop="code" sortable="custom"></el-table-column>
      <el-table-column label="标签类型名称" prop="name" sortable="custom"></el-table-column>
      <el-table-column label="所属图层" prop="layerConfigVO.name" sortable="custom"></el-table-column>
      <el-table-column label="数据类型" prop="dataTypeName"></el-table-column>
      <el-table-column label="标签名称是否默认显示" prop="isDefaultDisplayLabelName">
        <template #default="scope">
          {{ scope.row.isDefaultDisplayLabelName ? "是" : "否" }}
        </template>
      </el-table-column>
      <el-table-column prop="path" label="操作" width="200" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link @click="table.onEdit(scope.row, 'detail')">
            {{ "详情" }}
          </el-button>
          <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_LABELTYPECONFIG_EDIT">
            <el-button type="primary" link @click="table.onEdit(scope.row, 'edit')">
              {{ "编辑" }}
            </el-button>
          </Auth>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="table.total"
      v-model:page="query.params.pageNumber"
      v-model:limit="query.params.pageSize"
      @pagination="query.getPagination"
    ></Pagination>
    <LabelTypeEdit ref="labelTypeEditRef" @success-add="query.onQuery"></LabelTypeEdit>
  </div>
</template>

<script lang="ts" setup name="LabelTypeConfig">
import { onMounted, ref } from "vue";
import { MENU_BTNS_AUTH } from "@/components/auth/menuBtns";
import { getLabelTypeList, deleteLabelTypeCheck, deleteLabelType } from "@/api/visconfig.js";
import { handleParam } from "@/utils/common.js";
import { ElMessage, ElMessageBox } from "element-plus";
import LabelTypeEdit from "./component/labelTypeEdit.vue";
import { TableList, SortChangeEvent } from "../type";

const labelTypeEditRef = ref<InstanceType<typeof LabelTypeEdit>>();

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
    if (res.data.items) {
      table.value.data = res.data.items;
      table.value.total = res.data.totalNum;
    } else {
      ElMessage.error("接口异常");
    }
    table.value.loading = false;
  },
  onSelectionChange: (selection: any[]) => {
    table.value.ids = selection.map(item => item.id);
  },
  onEdit: (row: { [key: string]: any }, type: string) => {
    labelTypeEditRef.value?.openDialog(row, type);
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
  query.value.params.name = queryString;
  query.value.params.pageSize = 10000;
  query.value.params.pageNumber = 1;
  const res: { [key: string]: any } = await getLabelTypeList(...(handleParam(query.value.params) as [string, object]));
  // 调用 callback 返回建议列表的数据
  cb(res.data.items);
  query.value.params.pageSize = oldPageSize;
};

const handleSelect = async () => {
  table.value.loading = true;
  const res: { [key: string]: any } = await getLabelTypeList(...(handleParam(query.value.params) as [string, object]));
  table.value.data = res.data.items;
  table.value.total = res.data.totalNum;
  table.value.loading = false;
};

onMounted(() => {
  table.value.getTableData();
});
</script>

<style lang="scss" scoped>
.label-type-config {
  width: calc(100vw - 260px);
  height: calc(100vh - 109px);
  padding: 20px;
  background: var(--background-color);
}
.label-type-config-table {
  height: calc(100% - 153px);
  margin-bottom: 20px;
}
.label-type-config .inline-input {
  width: 100%;
}
</style>
