<template>
  <div class="line-chart" ref="lineChartRef"></div>
</template>
<script setup lang="ts" name="lineChart">
import * as echarts from "echarts";
import { onMounted, ref } from "vue";

const lineChartRef = ref();
let myChart: any = null;
const initOption = (chartData?: any) => {
  let option = {
    tooltip: {
      trigger: "axis",
      position: function (pt: any) {
        return [pt[0], "10%"];
      }
    },
    title: {
      left: "center",
      text: chartData?.ordinateName
    },
    legend: {},
    xAxis: {
      name: chartData?.xAxisName || "",
      type: chartData?.xAxisType || "category",
      boundaryGap: false
    },
    yAxis: {
      name: chartData?.yAxisName || "",
      type: "value",
      boundaryGap: [0, "100%"]
    },
    dataZoom: [
      {
        height: 16,
        bottom: 15,
        type: "slider",
        show: true,
        showDataShadow: false, //false去除滚轮中间那条线
        backgroundColor: "rgb(245,247,252)", //滚动条背景颜色
        borderColor: "transparent", //滚动条边框颜色
        fillerColor: "rgba(61,126,255, 0.1)", // 滚动条颜色
        handleSize: 30, //手柄尺寸
        showDetail: false, //拖拽不显示文字
        brushSelect: false //刷选功能，false阻止滚动条条长度改变
      },
      {
        type: "inside", // 支持内部鼠标滚动平移
        zoomOnMouseWheel: false, // 关闭滚轮缩放
        moveOnMouseWheel: true, // 开启滚轮平移
        moveOnMouseMove: true // 鼠标移动能触发数据窗口平移
      }
    ],
    series:
      chartData?.data?.map((item: any) => {
        return {
          name: item.name,
          type: "line",
          data: item.data,
          smooth: true,
          symbol: "none"
        };
      }) || []
  };
  option && myChart.setOption(option);
};
const setOption = (chartData: any) => {
  chartData && initOption(chartData);
};

onMounted(() => {
  myChart = echarts.init(lineChartRef.value);
  initOption();
});
defineExpose({
  setOption
});
</script>
<style lang="scss" scoped>
.line-chart {
  width: 100%;
  height: 100%;
}
</style>
