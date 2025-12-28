export function transformSpotFlowOptions(rawData: any) {
  if (!rawData || !rawData.legends || !rawData.legends.btc) return {};

  const btcData = rawData.legends.btc;

  // 1. 数据解析
  const dates = btcData.map((item: any) => item.date);
  const prices = btcData.map((item: any) => item.price.toFixed(0));
  
  // 净流入数据处理：单位转为 M (百万)
  const netflows = btcData.map((item: any) => (item.netflow / 1000000).toFixed(2));

  return {
    backgroundColor: 'transparent',
    title: {
      text: rawData.title,
      left: 10,
      top: 10,
      textStyle: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
    },
    // 图例：支持点击切换显示/隐藏
    legend: {
      data: ['Netflow', 'Price'],
      top: 45,
      right: 20,
      textStyle: { color: '#ccc', fontSize: 12 }
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '12%', // 留出空间给 dataZoom 或 X轴标签
      top: '25%',
      containLabel: true
    },
    // 针对 90D 数据的滑动缩放功能
    dataZoom: [
      {
        type: 'inside', // 手指直接在图表上滑动缩放
        start: 0,
        end: 100
      }
    ],
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: 'rgba(30, 30, 30, 0.9)',
      textStyle: { color: '#fff', fontSize: 12 },
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        let res = `${params[0].name}\n`;
        params.forEach((p: any) => {
          const isPrice = p.seriesName === 'Price';
          const value = isPrice ? `$${p.value.toLocaleString()}` : `${p.value}M`;
          const color = !isPrice && p.value >= 0 ? '#00C853' : (isPrice ? '#F39C12' : '#D32F2F');
          res += `${p.marker} ${p.seriesName}: <span style="color:${color}">${value}</span>\n`;
        });
        return res;
      }
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#333' } },
      axisLabel: {
        color: '#888',
        fontSize: 10,
        // 根据数据量自动调整标签密度
        interval: btcData.length > 30 ? 'auto' : 0, 
        rotate: btcData.length > 15 ? 45 : 0 // 超过15天数据自动旋转防止重叠
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Netflow (M)',
        splitLine: { lineStyle: { color: '#222', type: 'dashed' } },
        axisLabel: { 
          color: '#888',
          formatter: (v: any) => `${v}M`
        }
      },
      {
        type: 'value',
        name: 'Price',
        position: 'right',
        splitLine: { show: false },
        // 优化价格轴范围，确保折线在柱状图上方，不影响阅读
        min: (value: any) => Math.floor(value.min * 0.95),
        max: (value: any) => Math.ceil(value.max * 1.05),
        axisLabel: {
          color: '#F39C12',
          formatter: (v: any) => `$${(v / 1000).toFixed(0)}K`
        }
      }
    ],
    series: [
      {
        name: 'Netflow',
        type: 'bar',
        data: netflows,
        // 动态颜色：正数为绿，负数为红
        itemStyle: {
          color: (params: any) => params.value >= 0 ? '#00C853' : '#D32F2F'
        },
        barMaxWidth: 20 // 限制柱子最大宽度，防止7D模式下柱子过粗
      },
      {
        name: 'Price',
        type: 'line',
        yAxisIndex: 1, // 绑定右轴
        data: prices,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#F39C12', width: 2 },
        itemStyle: { color: '#F39C12' }
      }
    ]
  };
}