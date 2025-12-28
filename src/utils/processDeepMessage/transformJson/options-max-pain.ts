export function transformOptionsMaxPainOptions(rawData: any) {
  if (!rawData || !rawData.legends || !rawData.legends.data) return null;

  const dataList = rawData.legends.data;

  // 1. 提取 X 轴日期 (格式化为 MM-DD)
  const xAxisData = dataList.map((item: any) => {
    const date = new Date(item.expiration);
    return `${date.getMonth() + 1}-${date.getDate()}`;
  });

  // 2. 提取各项数据序列
  const callData = dataList.map((item: any) => item.call_open_interest_market_value);
  const putData = dataList.map((item: any) => item.put_open_interest_market_value);
  const maxPainData = dataList.map((item: any) => item.max_pain_price);

  return {
    backgroundColor: '#000',
    title: {
      text: rawData.title,
      subtext: rawData.subTitle,
      left: 'center',
      textStyle: { color: '#fff', fontSize: 16 },
      subtextStyle: { color: '#aaa' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(30, 30, 30, 0.9)',
      textStyle: { color: '#fff' }
    },
    legend: {
      data: ['Call OI MV', 'Put OI MV', 'Max Pain Price'],
      bottom: '5%',
      textStyle: { color: '#ccc' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: { lineStyle: { color: '#444' } },
      axisLabel: { color: '#888', rotate: 45 }
    },
    yAxis: [
      {
        // 左轴：Market Value (柱状图)
        type: 'value',
        name: 'Market Value',
        position: 'left',
        splitLine: { lineStyle: { color: '#222', type: 'dashed' } },
        axisLabel: {
          color: '#888',
          formatter: (value: number) => {
            if (value >= 1e6) return (value / 1e6).toFixed(0) + 'M';
            if (value >= 1e3) return (value / 1e3).toFixed(0) + 'K';
            return value;
          }
        }
      },
      {
        // 右轴：Price (折线图)
        type: 'value',
        name: 'Price',
        position: 'right',
        min: 'dataMin', // 自动调整最小值，让曲线波动更明显
        max: 'dataMax',
        splitLine: { show: false },
        axisLabel: {
          color: '#FFA500',
          formatter: (value: number) => (value / 1000).toFixed(0) + 'K'
        }
      }
    ],
    series: [
      {
        name: 'Call OI MV',
        type: 'bar',
        data: callData,
        itemStyle: { color: '#00C853' }, // 绿色
        barGap: '10%'
      },
      {
        name: 'Put OI MV',
        type: 'bar',
        data: putData,
        itemStyle: { color: '#D32F2F' } // 红色
      },
      {
        name: 'Max Pain Price',
        type: 'line',
        yAxisIndex: 1, // 使用右侧 Y 轴
        data: maxPainData,
        symbol: 'circle',
        symbolSize: 6,
        smooth: true,
        lineStyle: { color: '#FFA500', width: 2 },
        itemStyle: { color: '#FFA500' }
      }
    ]
  };
}