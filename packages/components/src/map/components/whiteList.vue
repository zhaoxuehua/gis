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
          <el-button type="primary">创建</el-button>
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
          <el-table-column label="开始免监控时间" prop="startTime" width="120"> </el-table-column>
          <el-table-column label="结束免监控时间" prop="endTime" width="120"> </el-table-column>
          <el-table-column label="状态" prop="status"> </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button link type="primary" @click="table.onEdit(scope.row, 'edit')"> 编辑 </el-button>
              <el-button link type="primary" @click="table.onEdit(scope.row, 'delete')"> 删除 </el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          v-if="table.data?.length"
          :total="table.total"
          v-model:page="query.params.pageNumber"
          v-model:limit="query.params.pageSize"
          @pagination="query.getPagination"
        ></Pagination>
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
import { deviceEquipList } from "@/api/device";
import WhiteListEdit from "./whiteListEdit.vue";

const props = withDefaults(defineProps<{ map: VisualMap | null }>(), {
  map: () => null
});
console.log(props, 7766);
const emits = defineEmits(["onClose"]);

const whiteListEditRef = ref<InstanceType<typeof WhiteListEdit>>();

// 关闭图例
const onClose = () => {
  emits("onClose", 4);
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

const onRefresh = () => {
  query.value.params.code = "";
  query.value.onQuery();
};

const table = ref<TableList>({
  loading: false,
  total: 0,
  ids: [],
  data: [],
  getTableData: async () => {
    table.value.loading = true;
    const res: { [key: string]: any } = await deviceEquipList(...(handleParam(query.value.params) as [string, object]));
    if (res.items) {
      table.value.data = res.items;
      table.value.total = res.totalNum;
    } else {
      ElMessage.error("接口异常");
    }

    table.value.loading = false;
  },
  onSelectionChange: () => {},
  onEdit: (row: { [key: string]: any }, type: string) => {
    if (type == "edit") {
      whiteListEditRef.value?.openDialog(row);
    } else if (type == "delete") {
      ElMessageBox.confirm("确定删除？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(async () => {
          // table.value.loading = true;
          // const res: { [key: string]: any } = await deleteLabel(row?.id);
          // if (res.code == 200) {
          //   ElMessage.success("删除成功");
          //   table.value.getTableData();
          // } else {
          //   ElMessage.error(res.msg);
          // }
        })
        .catch(() => {});
    }
  }
});

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
  width: 700px;
  height: 320px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
}
.title-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 50px;
  padding: 0 10px;
  background-color: var(--el-color-primary-light-8);
  span {
    font-size: 16px;
  }
  .icon {
    cursor: pointer;
  }
}
.content-box {
  flex: 1;
  padding: 10px;
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
        padding-right: 10px;
        color: #606266;
      }
    }
  }
  .list-area {
    margin-top: 20px;
    .header-table {
      background-color: #f7f7fa;
    }
    .table-area {
      height: 140px;
      overflow-y: auto;
    }
  }
}
</style>
