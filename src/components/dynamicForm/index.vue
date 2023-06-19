<!-- 动态表单 -->
<template>
  <el-form
    :inline="true"
    :model="form"
    :label-width="`${labelWidth}px`"
    ref="refForm"
    class="dynamic-form"
    v-if="formData?.length"
  >
    <el-form-item
      v-for="item in formData"
      :key="item.name"
      :prop="item.name ? item.name : ''"
      :label="!item.attributeMonitorUnitName ? item.label : item.label + '(' + item.attributeMonitorUnitName + ')'"
      :rules="rulesForm[item.name]"
    >
      <el-input
        v-model="form[item.name]"
        v-if="'stringinput' == item.type"
        clearable
        placeholder="请输入..."
        style="width: 200px"
      >
      </el-input>
      <el-input
        v-model="form[item.name]"
        v-else-if="'doubleinput' == item.type"
        :prop="item.name ? item.name : ''"
        clearable
        placeholder="请输入..."
        style="width: 200px"
      >
      </el-input>
      <el-select
        v-model="form[item.name]"
        v-else-if="'select' == item.type"
        clearable
        placeholder="请选择..."
        filterable
        style="width: 200px"
        :prop="item.name ? item.name : ''"
      >
        <el-option
          v-for="(optionItem, index) in item.option"
          :key="index"
          :label="optionItem.label"
          :value="optionItem.value"
        ></el-option>
      </el-select>
      <el-checkbox
        v-model="form[item.name]"
        v-else-if="'checkbox' == item.type"
        style="margin-right: 186px"
        :prop="item.name ? item.name : ''"
      >
      </el-checkbox>

      <el-date-picker
        v-model="form[item.name]"
        type="date"
        v-else-if="'date' == item.type"
        placeholder="请选择..."
        value-format="YYYY-MM-DD"
        style="width: 200px"
        :prop="item.name ? item.name : ''"
      >
      </el-date-picker>
      <el-date-picker
        v-model="form[item.name]"
        type="datetime"
        v-else-if="'datetime' == item.type"
        placeholder="请选择..."
        value-format="YYYY-MM-DD HH:mm:ss"
        style="width: 200px"
        :prop="item.name ? item.name : ''"
      >
      </el-date-picker>

      <el-input-number
        v-model="form[item.name]"
        v-else-if="'numberinput' == item.type"
        style="width: 200px"
        :prop="item.name ? item.name : ''"
        :step="item.step ? item.step : 1"
        :min="item.minValue ? item.minValue : -Infinity"
        :max="item.maxValue ? item.maxValue : Infinity"
      >
      </el-input-number>
      <div class="placeholder-form" v-else></div>
    </el-form-item>
  </el-form>
</template>

<script lang="ts">
import { reactive, toRefs, ref, defineComponent, watch } from "vue";
import * as Regular from "@/plugins/verification.js";

interface Option {
  label?: string;
  value?: string | number | boolean | any;
  [key: string]: any;
}
interface FormItem {
  type?: string;
  name: string;
  option?: Option[];
  extendAttributeValue?: string | number;
  [key: string]: any;
}

interface Form {
  value: { [key: string]: any };
  [key: string]: any;
}
interface State {
  optionMap: { [key: string]: any };
  formData: FormItem[];
  rulesForm: { [key: string]: any };
  [key: string]: any;
}

export default defineComponent({
  name: "DynamicForm",
  props: {
    formData: {
      type: Array as () => FormItem[],
      default: () => [],
      required: false
    },
    labelWidth: {
      type: Number,
      default: 188,
      required: false
    }
  },
  emits: ["dynamicChange"],
  setup(props, { emit }) {
    // 验证是否是浮点型
    const doubleScaleVerification = (rule: any, value: any, callback: any, label: any) => {
      if (value && !Regular.verifyDouble.test(String(value))) {
        return callback(new Error(`${label}必须是数字!`));
      }
      callback();
    };

    // 限制最小值
    const minValueVerification = (rule: any, value: any, callback: any, label: any, minValue: any, maxValue: any) => {
      if (minValue && maxValue) {
        if (value && !(Number(value) >= Number(minValue) && Number(value) <= Number(maxValue))) {
          return callback(new Error(`${label}在${minValue}与${maxValue}之间!`));
        }
      } else if (minValue && !maxValue) {
        if (value && !(Number(value) >= Number(minValue))) {
          return callback(new Error(`${label}不能小于${minValue}!`));
        }
      } else if (!minValue && maxValue) {
        if (value && !(Number(value) <= Number(maxValue))) {
          return callback(new Error(`${label}不能大于${maxValue}!`));
        }
      }
      callback();
    };

    // 限制精度
    const percisionVerification = (rule: any, value: any, callback: any, label: any, percision: any) => {
      if (value) {
        if (("" + value).includes(".")) {
          let arr = ("" + value).split(".");
          if (arr[arr.length - 1].length !== Number(percision)) {
            return callback(new Error(`${label}的精度是${percision}!`));
          }
          callback();
        } else {
          return callback(new Error(`${label}的精度是${percision}!`));
        }
      }
      callback();
    };

    const state: State = reactive({
      // 弹窗表单验证
      rulesForm: {},
      ruleDoubleArr: [], //double类型验证
      optionMap: {},
      formData: []
    });

    const refForm = ref<Form>({ value: {} });
    let form: Form = ref({});

    const initForm = () => {
      state.optionMap = {};
      state.formData.forEach((item: FormItem) => {
        if (item.type == "select") {
          if (state?.optionMap) {
            state.optionMap[item.name] = JSON.parse(JSON.stringify(item.option));
          }
          item.option = [];
        }
        if (!item.extendAttributeValue) {
          if (item.type == "checkbox") {
            form.value[item.name] = false;
          } else if (item.type == "numberinput") {
            form.value[item.name] = 0;
          } else {
            form.value[item.name] = "";
          }
        } else {
          if (item.type == "numberinput") {
            if (item.extendAttributeValue) {
              form.value[item.name] = Number(item.extendAttributeValue);
            }
          } else {
            form.value[item.name] = item.extendAttributeValue;
          }
        }
      });
      setTimeout(() => {
        state.formData.forEach((item: any) => {
          if (item.type == "select") {
            if (state.optionMap[item.name]) {
              item.option = state.optionMap[item.name];
            }
          }
        });
      }, 0);
    };

    const initRulesForm = () => {
      state.rulesForm = {};
      let rulesForm: { [key: string]: any[] } = {};
      state.formData.forEach(item => {
        rulesForm[item.name] = [];
        if (item["required"]) {
          // 必填
          let obj = { required: true, message: `${item.label}不能为空`, trigger: ["blur", "change"] };
          rulesForm[item.name].push(obj);
        } else {
          // 选填
          let obj = { required: false, message: `${item.label}不能为空`, trigger: ["blur", "change"] };
          rulesForm[item.name].push(obj);
        }

        // 长度验证只有字符串的时候有，其他时候没有
        if (item.type == "stringinput") {
          if (item.max) {
            // 长度不能超过
            let obj = { max: item.max, message: `${item.label}长度不能大于${item.max}`, trigger: ["blur", "change"] };
            rulesForm[item.name].push(obj);
          }
        }

        // 浮点验证
        if (item.type == "doubleinput") {
          let obj = {
            validator: (rule: any, value: any, callback: any) => {
              doubleScaleVerification(rule, value, callback, item.label);
            },
            trigger: ["blur", "change"]
          };
          rulesForm[item.name].push(obj);
          state.ruleDoubleArr.push(item.name);
        }

        if (item.type == "doubleinput") {
          if (item.minValue || item.maxValue) {
            let obj = {
              validator: (rule: any, value: any, callback: any) => {
                minValueVerification(rule, value, callback, item.label, item.minValue, item.maxValue);
              },
              trigger: ["blur", "change"]
            };
            rulesForm[item.name].push(obj);
            state.ruleDoubleArr.push(item.name);
          }
        }

        // 精度验证  精度只有浮点的时候有
        if (item.type == "doubleinput") {
          if (item.monitorPercision) {
            let obj = {
              validator: (rule: any, value: any, callback: any) => {
                percisionVerification(rule, value, callback, item.label, item.monitorPercision);
              },
              trigger: ["blur", "change"]
            };
            rulesForm[item.name].push(obj);
            state.ruleDoubleArr.push(item.name);
          }
        }
      });
      state.rulesForm = rulesForm;
    };

    watch(
      () => props.formData,
      async newVal => {
        state.formData = JSON.parse(JSON.stringify(newVal));
        initRulesForm();
        initForm();
      },
      {
        deep: true
      }
    );

    // 判断验证是否通过
    const formValidate = () => {
      return new Promise((resolve: any) => {
        refForm.value.validate((valid: any) => {
          if (valid) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    };

    watch(
      () => form.value,
      async newVal => {
        emit("dynamicChange", newVal);
      },
      {
        deep: true
      }
    );
    return {
      ...toRefs(state),
      refForm,
      form,
      formValidate,
      initForm,
      initRulesForm
    };
  }
});
</script>

<style lang="scss">
.dynamic-form {
  margin-top: 20px;
  border-radius: 0;
  .el-input,
  .el-select,
  .el-cascader,
  .el-date-picker,
  .el-date-editor,
  el-date-editor--datetime {
    width: 200px;
    .el-input__inner {
      width: 200px;
    }
  }
  .el-input-number {
    width: 200px;
  }
}
.dynamic-form .el-date-editor.el-input,
.el-date-editor.el-input__inner {
  width: 200px !important;
}
.placeholder-form {
  width: 200px;
  height: 1px;
}
</style>
