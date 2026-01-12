export function transformCapitalFlowChart(rawData: any) {
  if (!rawData || !rawData.legends) return {};

  const data = rawData.legends[Object.keys(rawData.legends)[0]];
  
  // 1. 提取维度数据
  const dates = data.map((item: any) => item.date.split('T')[0]); // 格式化日期: 2025-11-25
  const inflows = data.map((item: any) => (item.inflow / 1000000).toFixed(2)); // 转为 M 为单位
  const outflows = data.map((item: any) => (item.outflow / 1000000).toFixed(2));
  const prices = data.map((item: any) => item.price.toFixed(0));

  return {
    backgroundColor: '#121212', // 深色背景适配图片示例
    title: {
      text: rawData.title,
      left: 10,
      top: 10,
      textStyle: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
    },
    // 图例配置
    legend: {
      data: ['Inflow', 'Outflow', 'Btc Price'],
      top: 50,
      textStyle: { color: '#ccc', fontSize: 12 },
      itemWidth: 12,
      itemHeight: 8
    },
    // 移动端常用的直角坐标系内边距
    grid: {
      left: '3%',
      right: '3%',
      bottom: '10%',
      top: '25%',
      containLabel: true
    },
    // 提示框：React Native 必须使用纯文本换行
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: 'rgba(30, 30, 30, 0.9)',
      borderColor: '#444',
      textStyle: { color: '#fff', fontSize: 12 },
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        let res = `${params[0].name}\n`;
        params.forEach((p: any) => {
          const unit = p.seriesName === 'Btc Price' ? '$' : 'M';
          res += `${p.marker} ${p.seriesName}: ${unit}${p.value}\n`;
        });
        return res;
      }
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#444' } },
      axisLabel: { color: '#888', fontSize: 10, rotate: 0 },
      // 自动简化坐标轴标签，防止重叠
      axisTick: { alignWithLabel: true }
    },
    // 双 Y 轴配置
    yAxis: [
      {
        type: 'value',
        name: 'Amount (M)',
        position: 'left',
        splitLine: { lineStyle: { color: '#222', type: 'dashed' } },
        axisLabel: { 
          color: '#888', 
          fontSize: 10,
          formatter: '{value}M' 
        }
      },
      {
        type: 'value',
        name: 'Price',
        position: 'right',
        // 建议：手动设置 min/max 让折线始终位于柱状图上方，避免视觉混乱
        min: (value: any) => Math.floor(value.min * 0.8),
        max: (value: any) => Math.ceil(value.max * 1.2),
        splitLine: { show: false }, // 隐藏右轴分割线，保持画面简洁
        axisLabel: { 
          color: '#F39C12', 
          fontSize: 10,
          formatter: (v: any) => `$${(v / 1000).toFixed(0)}K` 
        }
      }
    ],
    series: [
      {
        name: 'Inflow',
        type: 'bar',
        stack: 'flow', // 堆叠显示或不堆叠，根据业务需求
        data: inflows,
        itemStyle: { color: '#00C853' }, // 绿色
        barWidth: '60%'
      },
      {
        name: 'Outflow',
        type: 'bar',
        stack: 'flow',
        data: outflows,
        itemStyle: { color: '#D32F2F' } // 红色
      },
      {
        name: 'Btc Price',
        type: 'line',
        yAxisIndex: 1, // 使用右侧坐标轴
        data: prices,
        smooth: true,   // 平滑曲线
        showSymbol: false,
        lineStyle: { color: '#F39C12', width: 2 },
        itemStyle: { color: '#F39C12' }
      }
    ]
  };
}