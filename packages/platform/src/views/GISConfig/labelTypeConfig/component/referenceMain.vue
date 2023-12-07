<template>
  <div class="reference-main">
    <el-dialog
      :title="'关联对象'"
      v-model="open"
      width="1140px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <el-container>
        <el-aside class="reference-side-tab">
          <div class="reference-side-tab-item" :class="{ active: isLogical === 2 }" @click="logicalChange(2)">物理设备类型</div>
          <div class="reference-side-tab-item" :class="{ active: isLogical === 1 }" @click="logicalChange(1)">逻辑设备类型</div>
          <div class="reference-side-tab-item" :class="{ active: isLogical === 3 }" @click="logicalChange(3)">外部对象类型</div>
        </el-aside>
        <el-main class="reference-main-content">
          <el-button class="confirm-button" type="primary" @click="onConfirm">确定关联</el-button>
          <el-tabs v-model="currentTab" @tab-click="onTabClick">
            <el-tab-pane :label="isLogical == 1 || isLogical == 2 ? '设备类型' : '对象类型'" name="equipType">
              <div class="query-areas">
                <el-form inline>
                  <el-form-item label="设备类型名称" required>
                    <el-input
                      v-model="filterText"
                      clearable
                      placeholder="请输入"
                      @clear="onQuery"
                      @input="onQuery"
                      style="width: 250px"
                    />
                  </el-form-item>
                </el-form>
              </div>
              <!-- 物理设备类型、逻辑设备类型列表、外部对象对象类型列表 -->
              <el-table
                :data="equipTypeList.data"
                v-loading="equipTypeList.loading"
                highlight-current-row
                empty-text="暂无数据"
                :row-style="{ height: 32 + 'px' }"
                :cell-style="{ padding: '0px' }"
                @selection-change="equipTypeList.onSelectionChange"
                max-height="355"
                ref="equipTypeTableRef"
                stripe
                border
              >
                <el-table-column type="selection"></el-table-column>
                <el-table-column label="序号" type="index" width="60"></el-table-column>
                <el-table-column
                  :label="isLogical == 1 || isLogical == 2 ? '设备类型编码' : '对象类型编码'"
                  prop="code"
                ></el-table-column>
                <el-table-column
                  :label="isLogical == 1 || isLogical == 2 ? '设备类型名称' : '对象类型名称'"
                  prop="name"
                ></el-table-column>
                <el-table-column label="创建时间" prop="createdOn"></el-table-column>
              </el-table>
            </el-tab-pane>
            <el-tab-pane :label="isLogical == 1 || isLogical == 2 ? '设备属性' : '对象属性'" name="equipAttribute">
              <ReferenceAttribute
                ref="referenceAttributeRef"
                :isLogical="isLogical"
                :equip-type-list="equipTypeList.data"
                @attribute-change="onAttributeChange"
              ></ReferenceAttribute>
            </el-tab-pane>
          </el-tabs>
        </el-main>
      </el-container>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup name="ReferenceMain">
import { onMounted, ref, watch } from "vue";
import { ElMessage, ElTable } from "element-plus";
import { getAllLabelTypeList } from "@/api/visconfig.js";
import ReferenceAttribute from "./referenceAttribute.vue";

const emit = defineEmits(["referenceChange"]);
// 物理设备 or 逻辑设备 or 外部对象  1是逻辑 2是物理
const isLogical = ref<number>(2);

const logicalChange = (value: number) => {
  isLogical.value = value;
};

// 弹窗
const open = ref<boolean>(false);
// input
const filterText = ref("");

const onQuery = () => {
  equipTypeList.value.fetchData();
};

const openDialog = () => {
  open.value = true;
};

const onClose = () => {
  open.value = false;
};

// 设备类型 or 设备属性 Tab
const currentTab = ref<string>("equipType");

const onTabClick = (tab: { [key: string]: any }) => {
  currentTab.value = tab.paneName;
  equipTypeTableRef.value?.clearSelection();
};

// 设备类型表格
const equipTypeTableRef = ref<InstanceType<typeof ElTable>>();

// 设备类型数据
const equipTypeList = ref({
  loading: false,
  data: [],
  ids: [],
  fetchData: async () => {
    equipTypeList.value.loading = true;
    // 物理设备类型、逻辑设备类型、外部设备类型
    const res: { [key: string]: any } = await getAllLabelTypeList(
      isLogical.value == 1 || isLogical.value == 2 ? isLogical.value : "",
      filterText.value
    );
    if (res.code == 200) {
      equipTypeList.value.data = res?.data || [];
    }
    equipTypeList.value.loading = false;
  },
  onSelectionChange: (selection: any) => {
    if (selection.length > 1) {
      let del_row = selection.shift();
      equipTypeTableRef.value?.toggleRowSelection(del_row, false); // 用于多选表格，切换某一行的选中状态，如果使用了第二个参数，则是设置这一行选中与否（selected 为 true 则选中）
    }
    equipTypeList.value.ids = selection.map((item: { [key: string]: any }) => item.id);
  }
});

// 设备属性变化
const onAttributeChange = (param: any) => {
  console.log(param);
};

// 关联设备属性组件
const referenceAttributeRef = ref<InstanceType<typeof ReferenceAttribute>>();

// 确认关联按钮
const onConfirm = () => {
  // 关联对象
  if (currentTab.value === "equipType") {
    if (equipTypeList.value.ids.length === 0) {
      ElMessage.warning("请选择设备类型");
      return;
    }

    const selectionRow = equipTypeList.value.data.find((item: any) => item.id === equipTypeList.value.ids[0]); // 设备类型选择行
    emit("referenceChange", selectionRow, null, isLogical.value);
  }

  // 关联设备属性
  if (currentTab.value === "equipAttribute") {
    const selectionRow = referenceAttributeRef.value?.getSelectAttribute(); // 设备类型行+属性选择行

    if (!selectionRow) {
      ElMessage.warning("请选择设备属性及属性值");
      return;
    }

    const { equipType, equipAttribute } = selectionRow;

    emit("referenceChange", equipType, equipAttribute, isLogical.value);
  }

  open.value = false;
};

onMounted(() => {
  equipTypeList.value.fetchData();
});

watch(isLogical, () => {
  filterText.value = "";
  equipTypeList.value.fetchData();
});
defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped>
.reference-main {
  ::v-deep(.el-overlay .el-dialog .el-dialog__body) {
    padding: 0 !important;
  }
}
.reference-main-content {
  position: relative;
  padding: 0;
  ::v-deep(.el-tabs .el-tabs__header .el-tabs__nav-wrap) {
    padding-left: 20px;
  }
  .confirm-button {
    position: absolute;
    right: 0;
    z-index: 1;
  }
  .query-areas {
    margin-top: 20px;
    margin-left: 10px;
  }
}
.reference-side-tab {
  width: 180px;
  border-right: #eeeeee solid 1px;
  .reference-side-tab-item {
    height: 40px;
    font-size: 14px;
    line-height: 40px;
    text-align: center;
    cursor: pointer;
    background-color: #f0f5f5;

    /* 鼠标悬停时的样式 */
    &:hover {
      font-weight: bold;
      color: var(--el-menu-hover-color) !important;
    }

    /* 鼠标激活时的样式 */
    &.active {
      font-weight: bold;
      color: var(--el-menu-active-color) !important;
      background-color: var(--el-menu-active-bg-color) !important;
    }
  }
}
</style>
