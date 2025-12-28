export function transformFuturesExchange(rawData: any) {
  if (!rawData || !rawData.legends) return null;

  const coins = ['BTC', 'ETH'];
  const options: any = {};

  // 辅助函数：格式化大额数字
  const formatVolume = (val: number) => {
    if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
    return '$' + val.toLocaleString();
  };

  coins.forEach((coin) => {
    const dataList = rawData.legends[coin] || [];
    
    // 转换 ECharts Treemap 格式
    const seriesData = dataList.map((item: any) => ({
      name: item.name,
      value: item.volume, // 矩形大小由 volume 决定
      change24h: item.change24h,
      // 自定义每个块的颜色：涨绿跌红
      itemStyle: {
        color: item.change24h >= 0 ? '#00C853' : '#D32F2F',
        borderColor: '#000',
        borderWidth: 1
      }
    }));

    options[`option${coin}`] = {
      backgroundColor: '#000',
      title: {
        text: `${coin} ${rawData.title}`,
        left: 10,
        top: 10,
        textStyle: { color: '#fff', fontSize: 16 }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (info: any) => {
          const { data } = info;
          return `${data.name}\nOI: ${formatVolume(data.value)}\n24h: ${data.change24h}%`;
        }
      },
      series: [
        {
          name: coin,
          type: 'treemap',
          visibleMin: 300, // 小于这个面积的块不显示文字，防止堆叠
          data: seriesData,
          leafDepth: 1,
          roam: false, // 禁用缩放平移，更适合移动端单屏查看
          nodeClick: false,
          breadcrumb: { show: false }, // 隐藏底部层级面包屑
          label: {
            show: true,
            position: 'insideTopLeft',
            distance: 5,
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold',
            // React Native WebView 环境下的换行处理
            formatter: (params: any) => {
              const { data } = params;
              const vol = formatVolume(data.value);
              const change = data.change24h + '%';
              // 矩形块内显示：交易所名、金额、涨跌幅
              return `{name|${data.name}}\n{val|${vol}}\n{change|${change}}`;
            },
            rich: {
              name: { fontSize: 14, fontWeight: 'bold', padding: [5, 0] },
              val: { fontSize: 11, color: '#eee', padding: [2, 0] },
              change: { fontSize: 11, color: '#fff' }
            }
          }
        }
      ]
    };
  });

  return {
    optionBTC: options.optionBTC,
    optionETH: options.optionETH
  };
}