export function transformMarketHeatMap(rawData: any) {
  if (!rawData || !rawData.legends) return {};

  const chartData = rawData.legends.map((item: any) => {
    let colorValue = item.roi;
    const limit = 0.05; 
    if (colorValue > limit) colorValue = limit;
    if (colorValue < -limit) colorValue = -limit;

    return {
      name: item.symbol,
      value: [item.market_cap, colorValue, item.roi], 
      itemData: {
        fullName: item.name,
        price: item.price,
        roiText: (item.roi * 100).toFixed(2) + '%'
      }
    };
  });

  return {
    backgroundColor: 'transparent',
    title: {
      text: rawData.title,
      subtext: rawData.subTitle,
      left: 'center',
      top: 0,
      textStyle: { color: '#fff', fontSize: 16 },
      subtextStyle: { fontSize: 10 }
    },
    // --- Tooltip 移动端优化配置 ---
    tooltip: {
      show: true,
      trigger: 'item',
      // 重要：在 RN WebView 中，必须开启 confine 以防止超出容器导致不可见
      confine: true, 
      // 重要：避免 ECharts 尝试使用 DOM 渲染，改用纯文本拼接
      backgroundColor: 'rgba(50, 50, 50, 0.95)',
      textStyle: {
        color: '#fff',
        fontSize: 12,
      },
      // 使用 \n 换行，而不是 <div> 标签
      formatter: (params: any) => {
        const d = params.data.itemData;
        const roi = params.data.value[2];
        const symbol = params.name;
        const price = d.price.toLocaleString();
        const roiText = d.roiText;
        
        // 返回纯字符串，RN 的 WebView 才能正常显示
        return `${d.fullName} (${symbol})\n` +
               `Price: $${price}\n` +
               `24H: ${roiText}`;
      }
    },
    visualMap: {
      show: false,
      min: -0.05,
      max: 0.05,
      dimension: 1,
      inRange: { color: ['#f63538', '#333333', '#30cc5a'] }
    },
    series: [{
      type: 'treemap',
      left: 0,
      right: 0,
      top: 70, // 稍微加大间距，留出 Tooltip 弹出的空间
      bottom: 10,
      width: '100%',
      height: 'auto',
      data: chartData,
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      label: {
        show: true,
        position: 'insideTopLeft',
        distance: 5,
        formatter: (params: any) => {
          // 根据方块大小决定显示的详情程度
          if (params.data.value[0] < 30000000000) return `{name|${params.name}}`;
          const d = params.data.itemData;
          return `{name|${params.name}}\n{price|$${d.price.toFixed(2)}}\n{roi|${d.roiText}}`;
        },
        rich: {
          name: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
          price: { fontSize: 10, color: '#ccc', height: 14 },
          roi: { fontSize: 10, color: '#fff' }
        }
      },
      itemStyle: {
        borderColor: '#000',
        borderWidth: 1,
        gapWidth: 1
      }
    }]
  };
}