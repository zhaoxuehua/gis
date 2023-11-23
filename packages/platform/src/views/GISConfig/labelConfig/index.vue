<template>
  <div class="standard-page">
    <div class="one-search">
      <el-form :model="query.params" @submit.prevent="query.onQuery">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="标签名称：">
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
    <div class="table-card">
      <div class="option">
        <div class="title">标签信息</div>
        <div class="btn">
          <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_LABELCONFIG_DELETE">
            <el-button @click="onDelete" :disabled="!table.ids.length"><Icon src="Delete"></Icon>{{ "删除" }}</el-button>
          </Auth>
          <!-- <el-button type="primary" icon="el-icon-plus" @click="onAdd">{{ '创建' }}</el-button> -->
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
        <el-table-column label="标签编码" prop="code" sortable="custom" min-width="240"></el-table-column>
        <el-table-column label="标签名称" prop="name" sortable="custom" min-width="180"></el-table-column>
        <el-table-column label="标签类型" prop="labelType" sortable="custom" min-width="180">
          <template #default="scope">
            {{ scope.row.labelType?.name }}
          </template>
        </el-table-column>
        <el-table-column label="所属图层" prop="refLayer" sortable="custom" min-width="120">
          <template #default="scope">
            {{ scope.row.refLayer?.name }}
          </template>
        </el-table-column>
        <el-table-column prop="path" label="操作" width="200" fixed="right" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button type="primary" link @click="table.onEdit(scope.row, 'detail')">
              {{ "详情" }}
            </el-button>
            <!-- <el-button link @click="table.onEdit(scope.row, 'edit')">
						{{ '编辑' }}
					</el-button> -->
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

    <LabelEdit ref="labelEditRef" @success-add="query.onQuery"></LabelEdit>

    <DetailDialog ref="detailDialogRef" :constant="'GIS_LABEL_DETAIL'" :title="'标签详情'">
      <template #labelType="scope">
        {{ scope.row.labelType?.name }}
      </template>
      <template #refLayer="scope">
        {{ scope.row.refLayer?.name }}
      </template>
    </DetailDialog>
  </div>
</template>

<script lang="ts" setup name="LayerConfig">
import { onMounted, ref } from "vue";
import { MENU_BTNS_AUTH } from "@/components/auth/menuBtns";
import { getLabelList, deleteLabelCheck, deleteLabel } from "@/api/visconfig.js";
import { handleParam } from "@/utils/common.js";
import { ElMessage, ElMessageBox } from "element-plus";
import DetailDialog from "@/components/detailDialog/index.vue";
import LabelEdit from "./component/labelEdit.vue";
import { TableList, SortChangeEvent } from "../type";

const labelEditRef = ref<InstanceType<typeof LabelEdit>>();
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
    const res: { [key: string]: any } = await getLabelList(...(handleParam(query.value.params) as [string, object]));
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
  onEdit: (row: any, type: string) => {
    if (type == "edit") {
      labelEditRef.value?.openDialog(row);
    } else if (type == "detail") {
      detailDialogRef.value?.openDialog(row);
    }
  }
});

// const onAdd = () => {
//   labelEditRef.value?.openDialog();
// };

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
  const res: { [key: string]: any } = await deleteLabelCheck(table.value.ids);
  if (res.code == 200) {
    if (res.data?.length == 0) {
      ElMessageBox.confirm("确定删除?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(async () => {
          table.value.loading = true;
          const res: { [key: string]: any } = await deleteLabel(table.value.ids);
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

const querySearch: (queryString: string, cb: (arg: any) => void) => void = async (
  queryString: string,
  cb: (arg: any) => void
) => {
  let oldPageSize = query.value.params.pageSize;
  query.value.params.name = queryString;
  query.value.params.pageSize = 10000;
  query.value.params.pageNumber = 1;
  const res: { [key: string]: any } = await getLabelList(...(handleParam(query.value.params) as [string, object]));
  // 调用 callback 返回建议列表的数据
  cb(res.data.items);
  query.value.params.pageSize = oldPageSize;
};

const handleSelect = async () => {
  table.value.loading = true;
  const res: { [key: string]: any } = await getLabelList(...(handleParam(query.value.params) as [string, object]));
  table.value.data = res.data.items;
  table.value.total = res.data.totalNum;
  table.value.loading = false;
};

onMounted(() => {
  table.value.getTableData();
});
</script>

<style lang="scss" scoped></style>
