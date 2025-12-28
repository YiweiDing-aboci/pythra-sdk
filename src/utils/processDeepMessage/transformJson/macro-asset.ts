export function transformMacroAsset(rawData: any) {
    const dataList = rawData.legends.data;

    // 格式化日期：MM.DD
    const xAxisData = dataList.map((item: any) => {
        const d = new Date(item.date);
        return `${d.getMonth() + 1}.${d.getDate()}`;
    });

    /**
     * 处理返回率：
     * 1. 转换为百分比
     * 2. 针对美股非交易日（值为0的情况），在图表中通过 '-' 或 null 使其“断开”或保持平稳
     */
    const getReturns = (key: string) => {
        return dataList.map((item: any) => {
            const val = item[key];
            // 假设非交易日 return 为 0，且这不是 BTC/ETH (加密货币 24/7)
            if (val === 0 && (key === 'SP500_return' || key === 'NASDAQ_return')) {
                return '-'; // ECharts 中 '-' 代表无数据，会断开连接
            }
            return parseFloat((val * 100).toFixed(2));
        });
    };

    return {
        backgroundColor: '#121212',
        title: {
            text: rawData.title,
            subtext: rawData.subTitle,
            textStyle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
            left: 10,
            top: 10
        },
        // 注意：在某些 RN ECharts 封装库中，tooltip 的 formatter 函数可能需要通过 string 注入
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(30, 30, 30, 0.9)',
            borderWidth: 0,
            textStyle: { color: '#ccc', fontSize: 12 },
            confine: true // 适配移动端，防止 tooltip 超出屏幕
        },
        legend: {
            data: ['BTC', 'ETH', 'SP500', 'NASDAQ'],
            top: 45,
            textStyle: { color: '#999', fontSize: 11 },
            itemWidth: 10,
            itemHeight: 10
        },
        grid: {
            left: '4%',
            right: '4%',
            bottom: '8%',
            top: '25%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: xAxisData,
            axisLine: { lineStyle: { color: '#333' } },
            axisLabel: { color: '#777', fontSize: 10, interval: 4 }, // 移动端展示，每隔4个点显示标签
            boundaryGap: false
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#222', type: 'dashed' } },
            axisLabel: { 
                color: '#777', 
                fontSize: 10,
                formatter: '{value}%'
            }
        },
        series: [
            {
                name: 'BTC',
                type: 'line',
                data: getReturns('BTC_return'),
                showSymbol: false,
                smooth: true, // 增加平滑度，适配移动端视觉
                itemStyle: { color: '#4A90E2' },
                lineStyle: { width: 2 }
            },
            {
                name: 'ETH',
                type: 'line',
                data: getReturns('ETH_return'),
                showSymbol: false,
                smooth: true,
                itemStyle: { color: '#A6CE39' },
                lineStyle: { width: 2 }
            },
            {
                name: 'SP500',
                type: 'line',
                data: getReturns('SP500_return'),
                showSymbol: false,
                connectNulls: true, // 非交易日跳过点，但保持线条连续
                itemStyle: { color: '#707080' },
                lineStyle: { width: 1.5, type: 'dotted' } // 美股用虚线区分
            },
            {
                name: 'NASDAQ',
                type: 'line',
                data: getReturns('NASDAQ_return'),
                showSymbol: false,
                connectNulls: true,
                itemStyle: { color: '#FFA500' },
                lineStyle: { width: 1.5, type: 'dotted' }
            }
        ]
    };
}