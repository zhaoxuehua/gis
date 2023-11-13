<template>
  <div>
    <el-form :inline="true" :model="form" label-width="150px" :rules="state.rulesForm" ref="refForm">
      <el-form-item label="IP" prop="host">
        <el-input placeholder="请输入..." v-model="form.host" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="端口" prop="port">
        <el-input placeholder="正整数" v-model="form.port" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="水深间隔(m)" prop="depth">
        <el-input placeholder="正整数" v-model="form.depth" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="设备类型" prop="equipType">
        <el-select v-model="form.equipType" placeholder="请选择..." @change="equipTypeChange" style="width: 200px">
          <el-option v-for="(item, idx) in equipTypeList.data" :key="idx" :label="item?.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="设备" prop="equipCodes">
        <el-select v-model="form.equipCodes" multiple collapse-tags placeholder="请选择..." style="width: 200px">
          <el-option v-for="(item, idx) in equipList.data" :key="idx" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
    </el-form>
    <span class="dialog-footer">
      <el-button type="primary" @click="onConfirm">确认</el-button>
    </span>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getDepthWater, getAllEquipTypeList, getEquipListByType } from "../../api/device";
import { handleParam } from "@/utils/common.js";

const state = reactive({
  // 弹窗表单验证
  rulesForm: {
    host: [
      { required: true, message: "IP不能为空", trigger: ["blur", "change"] },
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (
            !/^([01]?\d{1,2}|2[0-4]\d|25[0-5])\.([01]?\d{1,2}|2[0-4]\d|25[0-5])\.([01]?\d{1,2}|2[0-4]\d|25[0-5])\.([01]?\d{1,2}|2[0-4]\d|25[0-5])$/.test(
              value
            )
          ) {
            return callback(new Error("IP不正确"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ],
    port: [
      { required: true, message: "端口不能为空", trigger: ["blur", "change"] },
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (!/^[1-9]\d*$/.test(value)) {
            return callback(new Error("端口不正确"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ],
    depth: [
      { required: true, message: "水深间隔不能为空", trigger: ["blur", "change"] },
      {
        validator: (rule: any, value: any, callback: Function) => {
          if (!/^[1-9]\d*$/.test(value)) {
            return callback(new Error("水深间隔不正确"));
          }
          callback();
        },
        trigger: ["blur", "change"]
      }
    ],
    equipType: [{ required: true, message: "设备类型不能为空", trigger: ["blur", "change"] }],
    equipCodes: [{ required: true, message: "设备不能为空", trigger: ["blur", "change"] }]
  }
});
const refForm: any = ref();

const defaultParam = {
  host: "",
  port: "",
  depth: "",
  equipType: "",
  equipCodes: []
};

let form = ref<{
  host: string;
  port: string;
  depth: string;
  equipType: string;
  equipCodes: any;
}>(defaultParam);

const equipTypeChange = (val: any) => {
  equipList.value.data = [];
  form.value.equipCodes = [];
  equipList.value?.fetchData(val);
};

const onConfirm = () => {
  refForm.value?.validate(async (valid: any) => {
    if (valid) {
      let { host, port, depth, equipCodes } = { ...form.value };
      let param: { [key: string]: any } = {
        host,
        port,
        depth
      };
      // 设备选择全部时处理逻辑
      if (equipCodes?.includes("all")) {
        param.equipCodes = equipList.value?.data
          ?.filter((item: { [key: string]: any }) => item?.code != "all")
          ?.map((item: { [key: string]: any }) => item?.code);
      } else {
        param.equipCodes = equipCodes;
      }
      const res: { [key: string]: any } = await getDepthWater(param);
      if (res.code == 200) {
        ElMessage.success("操作成功");
      }
    }
  });
};

// 设备类型
const equipTypeList = ref<{
  data: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  fetchData: Function;
}>({
  data: [],
  fetchData: async () => {
    const res: { [key: string]: any } = await getAllEquipTypeList(
      ...(handleParam({ pageNumber: 1, pageSize: 100000, name: "", orderByColumn: "", isAsc: "" }) as [string, object])
    );
    if (res?.items) {
      equipTypeList.value.data = res.items || [];
    } else {
      ElMessage.error("接口异常");
    }
  }
});

// 根据设备类型获取设备
const equipList = ref<{
  data: Array<{
    id?: number;
    code: string;
    name: string;
  }>;
  fetchData: Function;
}>({
  data: [],
  fetchData: async (equipTypeCode: string) => {
    const res: { [key: string]: any } = await getEquipListByType(equipTypeCode);
    if (res?.code == 200) {
      if (res?.data?.length) {
        // 增加全部的逻辑
        let allItem = [{ code: "all", name: "全部" }];
        equipList.value.data = allItem.concat(res.data);
      } else {
        equipList.value.data = res?.data || [];
      }
    }
  }
});

onMounted(() => {
  equipTypeList.value?.fetchData();
});
</script>

<style lang="scss" scoped></style>
