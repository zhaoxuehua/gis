<template>
  <div class="white-list">
    <!-- title模块 -->
    <div class="title-box">
      <span>白名单</span>
      <Icon src="Close" :size="14" @click.stop="onClose" class="icon"></Icon>
    </div>
    <!-- 内容显示模块 -->
    <div class="content-box">
      <div class="operate-area">
        <div class="left-operate">
          <el-button type="primary" @click="onAdd">创建</el-button>
          <el-button type="primary" @click="onRefresh">刷新</el-button>
        </div>
        <div class="right-operate">
          <span>对象编码</span>
          <el-input
            placeholder="请输入"
            style="width: 200px; margin-right: 12px"
            v-model="query.params.code"
            @keyup.enter.stop="querySearch"
            @clear="querySearch"
          >
          </el-input>
          <el-button type="primary" @click="querySearch">搜索</el-button>
        </div>
      </div>
      <div class="list-area">
        <el-table
          class="table-area"
          :data="table.data"
          v-loading="table.loading"
          highlight-current-row
          empty-text="暂无数据"
          :row-style="{ height: 32 + 'px' }"
          :cell-style="{ padding: '0px' }"
          stripe
          border
        >
          <el-table-column label="对象编码" prop="name"></el-table-column>
          <el-table-column label="对象名称" prop="code"></el-table-column>
          <el-table-column label="开始免监控时间" prop="startTime" width="150"> </el-table-column>
          <el-table-column label="结束免监控时间" prop="endTime" width="150"> </el-table-column>
          <el-table-column label="状态" prop="status" width="100"> </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-link type="primary" class="my-el-link" :underline="false" @click="onEditListRow(scope.row, 'edit')"
                >编辑</el-link
              >
              <el-link type="primary" :underline="false" @click="onEditListRow(scope.row, 'delete')">删除</el-link>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container-gis" v-if="table.data?.length">
          <el-pagination
            :background="true"
            v-model:current-page="query.params.pageNumber"
            v-model:page-size="query.params.pageSize"
            :page-sizes="[10, 20, 30, 50]"
            layout="total, prev, pager, next, sizes"
            :total="table.total"
            :small="true"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
    <WhiteListEdit ref="whiteListEditRef" @success-add="querySearch"></WhiteListEdit>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { handleParam } from "@/utils/common.js";
import type { VisualMap, TableList } from "../type";
import WhiteListEdit from "./whiteListEdit.vue";
import { getWhiteList, whiteListDelete } from "../../api/gis.js";
import Icon from "./Icon.vue";

const props = withDefaults(defineProps<{ map: VisualMap | null; index: number }>(), {
  map: () => null,
  index: () => 0
});
console.log(props, 7766);
const emits = defineEmits(["onClose"]);

const whiteListEditRef = ref<InstanceType<typeof WhiteListEdit>>();

// 关闭图例
const onClose = () => {
  emits("onClose", props.index);
};

const query = ref({
  params: {
    code: "", // 对象编码
    orderByColumn: "",
    isAsc: "",
    pageNumber: 1,
    pageSize: 10
  },
  getPagination: (obj: any) => {
    query.value.params.pageNumber = obj.page;
    query.value.params.pageSize = obj.limit;
    query.value.onQuery();
  },
  onQuery: () => {
    table.value.getTableData();
  }
});

const handleSizeChange = (val: any) => {
  query.value.getPagination({ page: query.value.params.pageNumber, limit: val });
};

const handleCurrentChange = (val: any) => {
  query.value.getPagination({ page: val, limit: query.value.params.pageSize });
};

const onRefresh = () => {
  query.value.params.code = "";
  querySearch();
};

const table = ref<TableList>({
  loading: false,
  total: 0,
  ids: [],
  data: [],
  getTableData: async () => {
    table.value.loading = true;
    const res: { [key: string]: any } = await getWhiteList(...(handleParam(query.value.params) as [string, object]));
    if (res.items) {
      table.value.data = res.items;
      table.value.total = res.totalNum;
    } else {
      ElMessage.error("接口异常");
    }

    table.value.loading = false;
  },
  onSelectionChange: () => {},
  onEdit: () => {}
});

const onEditListRow = (row: { [key: string]: any }, type: string) => {
  if (type == "edit") {
    whiteListEditRef.value?.openDialog(row);
  } else if (type == "delete") {
    ElMessageBox.confirm("确定删除？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        table.value.loading = true;
        const res: { [key: string]: any } = await whiteListDelete(row?.id);
        if (res.code == 200) {
          ElMessage.success("删除成功");
          table.value.getTableData(); // 刷新列表
        } else {
          ElMessage.error(res.msg);
        }
      })
      .catch(() => {});
  }
};

const onAdd = () => {
  whiteListEditRef.value?.openDialog();
};

const querySearch = () => {
  query.value.params.pageNumber = 1;
  query.value.onQuery();
};

onMounted(() => {
  table.value.getTableData();
});
</script>

<style lang="scss" scoped>
.white-list {
  display: flex;
  flex-direction: column;
  width: 1150px;
  height: 400px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
}
.title-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 60px;
  padding: 0 20px;
  background-color: #f7f7fa;
  span {
    font-size: 16px;
  }
  .icon {
    cursor: pointer;
  }
}
.content-box {
  flex: 1;
  padding: 20px;
  .operate-area {
    display: flex;
    flex-direction: row;
    width: 100%;
    .right-operate {
      display: flex;
      flex: 1;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      span {
        padding-right: 20px;
        color: #606266;
      }
    }
  }
  .list-area {
    width: 100%;
    margin-top: 20px;
    .header-table {
      background-color: #f7f7fa;
    }
    .table-area {
      height: 200px;
      overflow-y: auto;
      .my-el-link {
        margin-right: 12px !important;
      }
    }
    .pagination-container-gis {
      display: flex;
      justify-content: end;
      padding: 0;
      margin: 0;
      margin-top: 20px;
    }
  }
}
::v-deep(.el-pagination .btn-next .el-icon),
::v-deep(.el-pagination .btn-prev .el-icon) {
  display: block;
  width: auto;
  font-size: 12px;
  font-weight: 700;
}
</style>
