/* =========================================================
 * 基础工具
 * ======================================================= */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Hue 最短路径插值（角度） */
function lerpAngleDeg(aDeg: number, bDeg: number, t: number) {
  const a = ((aDeg % 360) + 360) % 360;
  let b = ((bDeg % 360) + 360) % 360;
  let delta = b - a;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  const res = a + delta * t;
  return ((res % 360) + 360) % 360;
}

/* =========================================================
 * OKLCH → HEX（纯 JS，无依赖）
 * ======================================================= */

/** OKLCH → OKLab */
function oklchToOklab(L: number, C: number, hDeg: number) {
  const hRad = (hDeg * Math.PI) / 180;
  return {
    L,
    a: C * Math.cos(hRad),
    b: C * Math.sin(hRad)
  };
}

/** OKLab → Linear RGB */
function oklabToLinearRgb(L: number, a: number, b: number) {
  const l = L + 0.3963377774 * a + 0.2158037573 * b;
  const m = L - 0.1055613458 * a - 0.0638541728 * b;
  const s = L - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l ** 3;
  const m3 = m ** 3;
  const s3 = s ** 3;

  return {
    r: +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    g: -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    b: -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3
  };
}

/** Linear RGB → sRGB */
function linearToSrgb(v: number) {
  const x = clamp(v, 0, 1);
  return x <= 0.0031308
    ? 12.92 * x
    : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

/** sRGB → HEX */
function rgbToHex(r: number, g: number, b: number) {
  const toHex = (v: number) =>
    Math.round(clamp(v, 0, 1) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** OKLCH → HEX（最终对外函数） */
function oklchToHex(L: number, C: number, h: number) {
  const lab = oklchToOklab(L, C, h);
  const rgbLinear = oklabToLinearRgb(lab.L, lab.a, lab.b);
  const r = linearToSrgb(rgbLinear.r);
  const g = linearToSrgb(rgbLinear.g);
  const b = linearToSrgb(rgbLinear.b);
  return rgbToHex(r, g, b);
}

/* =========================================================
 * Web 同款取色逻辑（HEX 输出）
 * ======================================================= */

/** ROI > 0 */
function mapOklchPositiveHex(a: number, aMin: number, aMax: number) {
  const L1 = 0.808, C1 = 0.114, h1 = 19.571;
  const L2 = 0.505, C2 = 0.213, h2 = 27.518;

  const t = aMax === aMin ? 0 : clamp((a - aMin) / (aMax - aMin), 0, 1);

  return oklchToHex(
    lerp(L1, L2, t),
    lerp(C1, C2, t),
    lerpAngleDeg(h1, h2, t)
  );
}

/** ROI ≤ 0 */
function mapOklchNegativeHex(a: number, aMin: number, aMax: number) {
  const L1 = 0.871, C1 = 0.15, h1 = 154.449;
  const L2 = 0.527, C2 = 0.154, h2 = 150.069;

  const t = aMax === aMin ? 0 : clamp((a - aMin) / (aMax - aMin), 0, 1);

  return oklchToHex(
    lerp(L1, L2, t),
    lerp(C1, C2, t),
    lerpAngleDeg(h1, h2, t)
  );
}

/** 对外统一接口（和 Web 语义一致） */
function getBgColorHex(roi: number, min: number, max: number) {
  return roi > 0
    ? mapOklchPositiveHex(roi, min, max)
    : mapOklchNegativeHex(roi, min, max);
}

/* =========================================================
 * RN Market Heatmap 转换函数（最终）
 * ======================================================= */
export function transformMarketHeatMap(rawData: any) {
  if (!rawData || !rawData.legends) return {};

  const legends = rawData.legends;

  // —— 与 Web 完全一致的 ROI 分段统计 ——
  const positives = legends.filter((i: any) => i.roi > 0);
  const negatives = legends.filter((i: any) => i.roi <= 0);

  const minPositive = positives.length ? Math.min(...positives.map((i: any) => i.roi)) : 0;
  const maxPositive = positives.length ? Math.max(...positives.map((i: any) => i.roi)) : 0;

  const minNegative = negatives.length ? Math.min(...negatives.map((i: any) => i.roi)) : 0;
  const maxNegative = negatives.length ? Math.max(...negatives.map((i: any) => i.roi)) : 0;

  const chartData = legends.map((item: any) => {
    const roi = item.roi;
    const color = getBgColorHex(
      roi,
      roi > 0 ? minPositive : minNegative,
      roi > 0 ? maxPositive : maxNegative
    );

    return {
      name: item.symbol,
      value: item.market_cap,
      itemStyle: { color },
      itemData: {
        fullName: item.name,
        price: item.price,
        roiText: (roi * 100).toFixed(2) + '%'
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
    tooltip: {
      show: true,
      trigger: 'item',
      confine: true,
      backgroundColor: 'rgba(50,50,50,0.95)',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        const d = params.data.itemData;
        return (
          `${d.fullName} (${params.name})\n` +
          `Price: $${d.price.toLocaleString()}\n` +
          `24H: ${d.roiText}`
        );
      }
    },
    series: [
      {
        type: 'treemap',
        left: 0,
        right: 0,
        top: 70,
        bottom: 10,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        data: chartData,
        label: {
          show: true,
          formatter: (params: any) => {
            const d = params.data.itemData;
            return `{name|${params.name}}\n{roi|${d.roiText}}`;
          },
          rich: {
            name: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
            roi: { fontSize: 10, color: '#fff' }
          }
        },
        itemStyle: {
          borderColor: '#000',
          borderWidth: 1,
          gapWidth: 1
        }
      }
    ]
  };
}
