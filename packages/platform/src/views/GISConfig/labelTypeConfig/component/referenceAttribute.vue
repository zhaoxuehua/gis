<template>
  <div class="reference-attribute">
    <el-container>
      <el-aside class="reference-attribute-side">
        <div
          class="reference-attribute-side-item"
          v-for="item in equipTypeList"
          :key="item.id"
          :class="{ active: currentEquipTypeId === item.id }"
          @click="onEquipTypeChange(item)"
        >
          {{ item.name }}
        </div>
      </el-aside>
      <el-main class="reference-attribute-content">
        <el-table
          :data="attributeList.data"
          v-loading="attributeList.loading"
          highlight-current-row
          empty-text="暂无数据"
          :row-style="{ height: 40 + 'px' }"
          :cell-style="{ padding: '0px' }"
          @selection-change="attributeList.onSelectionChange"
          ref="attributeTableRef"
          max-height="400"
          stripe
          border
        >
          <el-table-column type="selection"></el-table-column>
          <el-table-column label="序号" type="index" width="60"></el-table-column>
          <el-table-column label="属性编码" prop="name"></el-table-column>
          <el-table-column label="属性名称" prop="label"></el-table-column>
          <el-table-column label="属性值" width="210">
            <template #default="scope">
              <el-input
                v-model="scope.row.bindValue"
                v-if="['stringinput'].includes(scope.row.type)"
                clearable
                placeholder="请输入..."
                style="width: 200px"
              >
              </el-input>
              <el-input
                v-model="scope.row.bindValue"
                v-else-if="['doubleinput'].includes(scope.row.type)"
                :prop="scope.row.name ? scope.row.name : ''"
                clearable
                placeholder="请输入..."
                style="width: 200px"
              >
              </el-input>
              <el-select
                v-model="scope.row.bindValue"
                v-else-if="['select'].includes(scope.row.type)"
                clearable
                placeholder="请选择..."
                filterable
                style="width: 200px"
                :prop="scope.row.name ? scope.row.name : ''"
              >
                <el-option
                  v-for="(optionItem, index) in scope.row.option"
                  :key="index"
                  :label="optionItem.label"
                  :value="optionItem.value"
                ></el-option>
              </el-select>
              <el-checkbox
                v-model="scope.row.bindValue"
                v-else-if="['checkbox'].includes(scope.row.type)"
                style="margin-right: 186px"
                :prop="scope.row.name ? scope.row.name : ''"
              >
              </el-checkbox>

              <el-date-picker
                v-model="scope.row.bindValue"
                type="date"
                v-else-if="['date'].includes(scope.row.type)"
                placeholder="请选择..."
                value-format="YYYY-MM-DD"
                style="width: 200px"
                :prop="scope.row.name ? scope.row.name : ''"
              >
              </el-date-picker>
              <el-date-picker
                v-model="scope.row.bindValue"
                type="datetime"
                v-else-if="['datetime'].includes(scope.row.type)"
                placeholder="请选择..."
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 200px"
                :prop="scope.row.name ? scope.row.name : ''"
              >
              </el-date-picker>

              <el-input-number
                v-model="scope.row.bindValue"
                v-else-if="['numberinput'].includes(scope.row.type)"
                style="width: 200px"
                :prop="scope.row.name ? scope.row.name : ''"
                :step="scope.row.step ? scope.row.step : 1"
                :min="scope.row.minValue ? scope.row.minValue : -Infinity"
                :max="scope.row.maxValue ? scope.row.maxValue : Infinity"
              >
              </el-input-number>
            </template>
          </el-table-column>
        </el-table>
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts" setup name="ReferenceAttribute">
import { onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { getBindAttributeByEquipType, getBindAttributeByObjType } from "@/api/device.js";

const props = defineProps({
  equipTypeList: Array<any>,
  isLogical: Number
});

const currentEquipTypeId = ref();
// 选择设备类型(会根据设备类型查对应的属性列表)
const onEquipTypeChange = (equipType: any) => {
  currentEquipTypeId.value = equipType.id;
};

const attributeTableRef = ref();
const attributeList = ref({
  loading: false,
  data: [],
  ids: [],
  // 根据选择的类型查询属性列表
  fetchData: async () => {
    attributeList.value.loading = true;

    if (props.isLogical == 1 || props.isLogical == 2) {
      const res: { [key: string]: any } = await getBindAttributeByEquipType(currentEquipTypeId.value);
      if (res.code === 200 && res.data) {
        attributeList.value.data = res.data;
      } else {
        ElMessage.error("接口异常");
      }
    } else {
      // 根据外部对象获取属性
      const res: { [key: string]: any } = await getBindAttributeByObjType(currentEquipTypeId.value);
      if (res.code === 200 && res.data) {
        attributeList.value.data = res.data;
      } else {
        ElMessage.error("接口异常");
      }
    }
    attributeList.value.loading = false;
  },
  onSelectionChange: (selection: any) => {
    if (selection.length > 1) {
      let del_row = selection.shift();
      attributeTableRef.value.toggleRowSelection(del_row, false); // 用于多选表格，切换某一行的选中状态，如果使用了第二个参数，则是设置这一行选中与否（selected 为 true 则选中）
    }
    attributeList.value.ids = selection.map((item: any) => item.extendAttribute);
  }
});

const getSelectAttribute = () => {
  if (attributeList.value.ids.length > 0) {
    const selectionRow: any = attributeList.value.data.find((item: any) => item.extendAttribute === attributeList.value.ids[0]);

    if (selectionRow?.bindValue) {
      const equipType = props.equipTypeList?.find((item: any) => item.id === currentEquipTypeId.value);
      return { equipType, equipAttribute: selectionRow };
    } else {
      return null;
    }
  } else {
    return null;
  }
};

onMounted(() => {});

watch(currentEquipTypeId, newVal => {
  if (newVal) {
    attributeList.value.fetchData();
  }
});

defineExpose({
  getSelectAttribute
});
</script>

<style lang="scss" scoped>
.reference-attribute {
  .reference-attribute-side {
    width: 180px;
    max-height: 400px;
    border-right: var(--border-color) solid 1px;
    .reference-attribute-side-item {
      height: 40px;
      font-size: 12px;
      line-height: 40px;
      text-align: center;
      cursor: pointer;
      &.active {
        color: var(--color-primary);
        background-color: var(--color-primary-tran-1);
      }
    }
  }
  .reference-attribute-content {
    padding: 0;
  }
}
</style>
