import { getChatExtract } from "../../api/getChatExtract";
import { EntityItem, ProcessedMessageData } from "../../types";
import { transformCapitalFlowChart } from "./transformJson/capital-flow";
import { transformFearGreedOptions } from "./transformJson/fear-greed";
import { transformFuturesExchange } from "./transformJson/futures-exchange";
import { transformMacroAsset } from "./transformJson/macro-asset";
import { transformMarketHeatMap } from "./transformJson/market-heatmap";
import { transformOptionsMaxPainOptions } from "./transformJson/options-max-pain";
import { transformSpotFlowOptions } from "./transformJson/spot-flow";

function getCodePointIndexMap(inputString: string) {
  let indexMap = new Map();
  let codePointIndex = 0;
  let codeUnitIndex = 0;
  for (const char of inputString) {
    indexMap.set(codePointIndex, codeUnitIndex);
    codePointIndex += 1;
    codeUnitIndex += char.length;
  }

  return indexMap;
}

/**
 * 处理图表占位符
 */
function processContentWithChart(input: string): {
  content: string;
  chartButtons: { [key: string]: number };
} {
  const chartBt: { [key: string]: number } = {};
  let chartProcessText = input;

  const idToIndex = new Map<string, number>();
  let sourceIndex = 1;

  // 匹配 <!-- id="任意ID" type="chart" -->，支持单引号和双引号
  const sourceRegex = /<!--\s*id\s*=\s*["']([^"']+)["']\s+type\s*=\s*["']chart["']\s*-->/gi;

  chartProcessText = chartProcessText.replace(sourceRegex, (match, idStr) => {
    let currentIndex: number;

    if (!idToIndex.has(idStr)) {
      // 首次遇到这个ID，分配新的索引
      currentIndex = sourceIndex;
      idToIndex.set(idStr, currentIndex);
      sourceIndex++;
    } else {
      // 已经见过这个ID，使用之前的索引
      currentIndex = idToIndex.get(idStr)!;
    }

    const placeholder = `{{CHART_${currentIndex}}}`;
    chartBt[placeholder] = currentIndex;

    return placeholder;
  });

  return {
    content: chartProcessText,
    chartButtons: chartBt
  };
}

/**
 * 处理JSON代码块
 */
function processContentWithJson(input: string): {
  content: string;
  jsonButtons: { [key: string]: any };
} {
  const jsonBt: { [key: string]: any } = {};
  let jsonProcessText = input;
  let jsonIndex = 1;

  // 匹配 ```json ... ```
  const jsonRegex = /```json\s*([\s\S]*?)```/gi;

  jsonProcessText = jsonProcessText.replace(jsonRegex, (_match, jsonContent) => {
    const placeholder = `{{JSON_${jsonIndex}}}`;
    try {
      jsonBt[placeholder] = JSON.parse(jsonContent.trim());
      if (jsonBt[placeholder]?.chartType === 'market-heatmap') {
        jsonBt[placeholder].chart = transformMarketHeatMap(jsonBt[placeholder])
      } else if (jsonBt[placeholder]?.chartType === 'crypto-capital-flow') {
        jsonBt[placeholder].chart = transformCapitalFlowChart(jsonBt[placeholder])
      } else if (jsonBt[placeholder]?.chartType === 'crypto-spot-flow') {
        jsonBt[placeholder].chart = transformSpotFlowOptions(jsonBt[placeholder])
      } else if (jsonBt[placeholder]?.chartType === 'fear-index') {
        jsonBt[placeholder].chart = transformFearGreedOptions(jsonBt[placeholder])
        jsonBt[placeholder].hasOption = true
      } else if (jsonBt[placeholder]?.chartType === 'futures-oi-exchange-heatmap') {
        jsonBt[placeholder].chart = transformFuturesExchange(jsonBt[placeholder])
        jsonBt[placeholder].hasOption = true
      } else if (jsonBt[placeholder]?.chartType === 'options-oi-max-pain') {
        jsonBt[placeholder].chart = transformOptionsMaxPainOptions(jsonBt[placeholder])
      } else if (jsonBt[placeholder]?.chartType === 'macro-data-analysis') {
        jsonBt[placeholder].chart = transformMacroAsset(jsonBt[placeholder])
      }
    } catch (e) {
      jsonBt[placeholder] = {};
    }
    jsonIndex++;

    return placeholder;
  });

  return {
    content: jsonProcessText,
    jsonButtons: jsonBt
  };
}

/**
 * 处理来源占位符
 */
function processContentWithSources(input: string): {
  content: string;
  sourceButtons: { [key: string]: number };
} {
  const sourceBt: { [key: string]: number } = {};
  let sourceProcessText = input;

  const idToIndex = new Map<string, number>();
  let sourceIndex = 1;

  // 匹配 <!-- id="任意ID" type="source" -->，支持单引号和双引号
  const sourceRegex = /<!--\s*id\s*=\s*["']([^"']+)["']\s+type\s*=\s*["']source["']\s*-->/gi;

  sourceProcessText = sourceProcessText.replace(sourceRegex, (_match, idStr) => {
    let currentIndex: number;

    if (!idToIndex.has(idStr)) {
      // 首次遇到这个ID，分配新的索引
      currentIndex = sourceIndex;
      idToIndex.set(idStr, currentIndex);
      sourceIndex++;
    } else {
      // 已经见过这个ID，使用之前的索引
      currentIndex = idToIndex.get(idStr)!;
    }

    const placeholder = `{{SOURCE_${currentIndex}}}`;
    sourceBt[placeholder] = currentIndex;

    return placeholder;
  });

  return {
    content: sourceProcessText,
    sourceButtons: sourceBt
  };
}

/**
 * 处理实体占位符
 */
function processContentWithEntities(
  content: string,
  entities: EntityItem[]
): {
  content: string;
  entityButtons: { [key: string]: EntityItem };
} {
  const entityBts: { [key: string]: EntityItem } = {};
  let resultText = content;

  const codeMap = getCodePointIndexMap(resultText);

  // 从后往前排序，避免替换时位置偏移
  const array = entities.sort((a: any, b: any) => b.start - a.start);

  array.forEach((entity: any, index: number) => {
    const { start, end } = entity;

    // 获取映射后的索引位置
    const startIndex = codeMap.get(start);
    const endIndex = codeMap.get(end);

    // 验证索引有效性
    if (startIndex === undefined || endIndex === undefined) {
      // console.warn(`Invalid entity indices: start=${start}, end=${end}`);
      return;
    }

    if (startIndex < 0 || endIndex > resultText.length || startIndex >= endIndex) {
      console.warn(`Out of range entity: start=${startIndex}, end=${endIndex}, textLength=${resultText.length}`);
      return;
    }

    const placeholder = `{{ENTITY_${index}}}`;

    // 使用数组方式拼接，避免字符串长度超限
    const parts = [
      resultText.slice(0, startIndex),
      placeholder,
      resultText.slice(endIndex)
    ];

    entityBts[placeholder] = entity;
    resultText = parts.join('');
  });

  return {
    content: resultText,
    entityButtons: entityBts
  };
}

/**
 * 处理深度消息内容
 * @param content 原始消息内容
 * @param needEntityExtract 是否需要进行实体提取和替换（可选）
 * @returns 处理后的数据，包含 processedContent 和各种按钮映射
 */
export async function processDeepMessage(
  content: string,
  needEntityExtract = false
): Promise<ProcessedMessageData> {
  let resultContent = content;
  let entityButtons: { [key: string]: EntityItem } = {};
  let sourceButtons: { [key: string]: number } = {};
  let chartButtons: { [key: string]: number } = {};
  let jsonButtons: { [key: string]: any } = {};
  let entities: EntityItem[] = [];

  // 2. 处理来源
  const sourceResult = processContentWithSources(resultContent);
  resultContent = sourceResult.content;
  sourceButtons = sourceResult.sourceButtons;

  // 3. 处理图表
  const chartResult = processContentWithChart(resultContent);
  resultContent = chartResult.content;
  chartButtons = chartResult.chartButtons;

  // 4. 处理JSON代码块
  const jsonResult = processContentWithJson(resultContent);
  resultContent = jsonResult.content;
  jsonButtons = jsonResult.jsonButtons;

  // 5. 处理实体（如果需要）
  if (needEntityExtract) {
    const {entities}  = await getChatExtract(resultContent);
    if (entities && entities.length > 0) {
      const entityResult = processContentWithEntities(resultContent, entities);
      resultContent = entityResult.content;
      entityButtons = entityResult.entityButtons;
    }
  }

  return {
    content: resultContent,
    entityButtons,
    sourceButtons,
    chartButtons,
    jsonButtons,
    entities
  };
}
