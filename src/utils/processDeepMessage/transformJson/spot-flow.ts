export function transformSpotFlowOptions(rawData: any) {
  if (!rawData || !rawData.legends) return {};

  // 动态获取第一个可用的加密货币数据
  const cryptoKeys = Object.keys(rawData.legends);
  if (cryptoKeys.length === 0) return {};

  // 获取第一个加密货币的数据（btc, eth, 或其他）
  const cryptoKey = cryptoKeys[0];
  const cryptoData = rawData.legends[cryptoKey];

  if (!cryptoData) return {};

  // 1. 数据解析 - 格式化日期，只显示月-日
  const dates = cryptoData.map((item: any) => {
    // 假设 item.date 格式为 "2024-12-25" 或类似格式
    const dateStr = item.date;
    if (dateStr && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 3) {
        // 返回 MM-DD 格式
        return `${parts[1]}-${parts[2]}`;
      }
    }
    return dateStr;
  });
  const prices = cryptoData.map((item: any) => item.price.toFixed(0));

  // 流入流出数据处理：单位转为 M (百万)
  // 注意：如果原数据只有 netflow，需要根据正负值来区分 inflow/outflow
  const inflows = cryptoData.map((item: any) => {
    if (item.inflow !== undefined) {
      return (Math.abs(item.inflow) / 1000000).toFixed(2);
    }
    // 如果没有 inflow 字段，使用 netflow 的正值
    return item.netflow > 0 ? (item.netflow / 1000000).toFixed(2) : 0;
  });

  const outflows = cryptoData.map((item: any) => {
    if (item.outflow !== undefined) {
      return (-Math.abs(item.outflow) / 1000000).toFixed(2);
    }
    // 如果没有 outflow 字段，使用 netflow 的负值
    return item.netflow < 0 ? (item.netflow / 1000000).toFixed(2) : 0;
  });

  const netflows = cryptoData.map((item: any) => (item.netflow / 1000000).toFixed(2));

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
      data: ['Inflow', 'Outflow', 'Price'],
      top: 45,
      right: 20,
      textStyle: { color: '#ccc', fontSize: 12 }
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '15%', // 增加底部空间给 dataZoom 和旋转的标签
      top: '25%',
      containLabel: true
    },
    // 针对 90D 数据的滑动缩放功能
    dataZoom: [
      {
        type: 'inside', // 手指直接在图表上滑动缩放
        start: 0,
        end: 100
      },
      {
        type: 'slider', // 添加底部滑块控制
        show: true,
        start: 0,
        end: 100,
        bottom: '2%',
        height: 20,
        textStyle: {
          color: '#888'
        },
        borderColor: '#333',
        fillerColor: 'rgba(255,255,255,0.1)',
        handleStyle: {
          color: '#666',
          borderColor: '#888'
        }
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
          const isInflow = p.seriesName === 'Inflow';
          const isOutflow = p.seriesName === 'Outflow';

          let value = '';
          let color = '';

          if (isPrice) {
            value = `$${p.value.toLocaleString()}`;
            color = '#F39C12';
          } else if (isInflow) {
            value = `${p.value}M`;
            color = '#00C853';
          } else if (isOutflow) {
            value = `${p.value}M`;
            color = '#D32F2F';
          } else {
            value = `${p.value}M`;
            color = p.value >= 0 ? '#00C853' : '#D32F2F';
          }

          res += `${p.marker} ${p.seriesName}: ${value}\n`;
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
        // 根据数据量自动调整标签密度和旋转角度
        interval: (index: number, value: string) => {
          // 根据数据总量动态计算间隔
          const totalPoints = cryptoData.length;
          if (totalPoints <= 7) {
            return true; // 显示所有标签
          } else if (totalPoints <= 14) {
            return index % 2 === 0; // 每隔1个显示
          } else if (totalPoints <= 30) {
            return index % 4 === 0; // 每隔3个显示
          } else if (totalPoints <= 60) {
            return index % 7 === 0; // 每隔6个显示
          } else if (totalPoints <= 90) {
            return index % 10 === 0; // 每隔9个显示
          } else {
            return index % 15 === 0; // 每隔14个显示
          }
        },
        rotate: 45 // 始终使用45度旋转，避免重叠
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Flow (M)',
        splitLine: { lineStyle: { color: '#222', type: 'dashed' } },
        axisLabel: {
          color: '#888',
          formatter: (v: any) => `${v}M`
        }
      },
      {
        type: 'value',
        name: 'Price ($)',
        position: 'right',
        splitLine: { show: false },
        // 优化价格轴范围，确保折线在柱状图上方，不影响阅读
        min: (value: any) => Math.floor(value.min * 0.95),
        max: (value: any) => Math.ceil(value.max * 1.05),
        axisLabel: {
          color: '#F39C12',
          formatter: (v: any) => {
            if (v >= 1000) {
              return `$${(v / 1000).toFixed(2)}K`;
            }
            return `$${v}`;
          }
        }
      }
    ],
    series: [
      {
        name: 'Inflow',
        type: 'bar',
        data: inflows,
        itemStyle: {
          color: '#00C853'
        },
        barMaxWidth: 15,
        barGap: '10%'
      },
      {
        name: 'Outflow',
        type: 'bar',
        data: outflows,
        itemStyle: {
          color: '#D32F2F'
        },
        barMaxWidth: 15
      },
      {
        name: 'Price',
        type: 'line',
        yAxisIndex: 1, // 绑定右轴
        data: prices,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#F39C12', width: 2 },
        itemStyle: { color: '#F39C12' },
        z: 10 // 确保线在柱状图上方
      }
    ]
  };
}