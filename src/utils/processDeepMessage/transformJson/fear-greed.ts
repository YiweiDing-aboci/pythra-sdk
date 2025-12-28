export function transformFearGreedOptions(rawData: any) {
  if (!rawData || !rawData.legends) return null;

  const periods = ['7D', '30D', '90D'];
  const options: any = {};

  periods.forEach((period) => {
    const data = rawData.legends[period] || [];
    const dates = data.map((item: any) => item.date);
    const values = data.map((item: any) => item.value);

    options[`option${period}`] = {
      backgroundColor: '#000',
      title: {
        text: rawData.title,
        left: 10,
        top: 10,
        textStyle: { color: '#fff', fontSize: 16 }
      },
      grid: {
        left: '5%',
        right: '12%', // 为右侧文字留出空间
        bottom: period === '90D' ? '15%' : '10%',
        top: '20%',
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: any) => {
          const val = params[0].value;
          let status = '';
          if (val <= 20) status = 'Extreme Fear';
          else if (val <= 40) status = 'Fear';
          else if (val <= 60) status = 'Neutral';
          else if (val <= 80) status = 'Greed';
          else status = 'Extreme Greed';
          return `${params[0].name}\nIndex: ${val} (${status})`;
        }
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          color: '#666',
          fontSize: 10,
          interval: period === '90D' ? 10 : (period === '30D' ? 4 : 0),
          rotate: period === '7D' ? 0 : 45
        },
        axisLine: { lineStyle: { color: '#333' } }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        interval: 20,
        splitLine: { lineStyle: { color: '#1a1a1a' } },
        axisLabel: { color: '#666', fontSize: 10 }
      },
      // 使用 visualMap 自动根据数值改变线条颜色（匹配 UI 稿的红-黄-绿）
      visualMap: {
        show: false,
        pieces: [
          { gt: 0, lte: 20, color: '#FF4D4D' },    // Extreme Fear
          { gt: 20, lte: 40, color: '#FF9F43' },   // Fear
          { gt: 40, lte: 60, color: '#FFDB5C' },   // Neutral
          { gt: 60, lte: 80, color: '#26DE81' },   // Greed
          { gt: 80, lte: 100, color: '#00C853' }   // Extreme Greed
        ],
        outOfRange: { color: '#ccc' }
      },
      // 辅助背景区域（对应 UI 稿中的不同情绪层）
      series: [
        {
          type: 'line',
          data: values,
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          lineStyle: { width: 3 },
          // 标记点，可以在最后一天显示当前数值
          markPoint: {
            data: [{ type: 'max', name: 'Current' }],
            symbol: 'circle',
            symbolSize: 10,
            label: { show: false }
          },
          // 情绪区间背景渲染
          markLine: {
            silent: true,
            symbol: 'none',
            label: { position: 'end', color: '#666', fontSize: 10 },
            data: [
              { yAxis: 20, label: { formatter: 'Fear' } },
              { yAxis: 40, label: { formatter: 'Neutral' } },
              { yAxis: 60, label: { formatter: 'Greed' } },
              { yAxis: 80, label: { formatter: 'Ext. Greed' } }
            ],
            lineStyle: { color: '#333', type: 'dashed' }
          }
        }
      ]
    };
  });

  return {
    option7D: options.option7D,
    option30D: options.option30D,
    option90D: options.option90D
  };
}