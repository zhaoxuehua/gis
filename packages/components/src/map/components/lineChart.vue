<template>
  <div class="line-chart" ref="lineChartRef"></div>
</template>
<script setup lang="ts" name="lineChart">
import * as echarts from "echarts";
import { onMounted, ref } from "vue";

const colorStyle = ["#16eba8", "#ffe051", "#00cbfa", "#c400be", "#6191a8", "#ff7e63", "#9ba2ff", "#c7e87d", "#3d9999"];
const lineChartRef = ref();
let myChart: any = null;
const initOption = (chartData?: any) => {
  let option = {
    color: chartData?.color?.length ? chartData?.color : colorStyle,
    tooltip: {
      trigger: "axis",
      confine: true,
      position: function (pt: any) {
        return [pt[0], "10%"];
      },
      formatter(params: any) {
        let str = `${params[0].data[0]}${chartData?.xAxisUnit}<br/>`;
        params.forEach((item: any) => {
          str += `${item.marker}${item.seriesName}：${item.data[1]}${chartData?.yAxisUnit || ""}<br/>`;
        });
        return str;
      }
    },
    title: {
      left: "center",
      text: chartData?.ordinateName
    },
    legend: {
      textStyle: {
        width: 120,
        overflow: "break"
      }
    },
    xAxis: {
      name:
        chartData?.xAxisName && chartData?.xAxisUnit
          ? `${chartData?.xAxisName}(${chartData?.xAxisUnit})`
          : chartData?.xAxisName || chartData?.xAxisUnit || "",
      type: chartData?.xAxisType || "category",
      boundaryGap: false
    },
    yAxis: {
      name:
        chartData?.yAxisName && chartData?.yAxisUnit
          ? `${chartData?.yAxisName}(${chartData?.yAxisUnit})`
          : chartData?.yAxisName || chartData?.yAxisUnit || "",
      type: "value",
      // boundaryGap: [0, "100%"]
      max: chartData?.ymax ? chartData?.ymax : undefined
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
  chartData.color = chartData.color.filter(Boolean);
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
