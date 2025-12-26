import { EntityItem, ProcessedMessageData } from "../types";

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
 * 处理来源占位符
 */
function processContentWithSources(input: string): {
  content: string;
  sourceButtons: { [key: string]: number };
  chartButtons: { [key: string]: number };
} {
  const sourceBt: { [key: string]: number } = {};
  let sourceProcessText = input;

  const idToIndex = new Map<string, number>();
  let sourceIndex = 1;

  // 匹配 <!-- id="任意ID" type="source" -->，支持单引号和双引号
  const sourceRegex = /<!--\s*id\s*=\s*["']([^"']+)["']\s+type\s*=\s*["']source["']\s*-->/gi;

  sourceProcessText = sourceProcessText.replace(sourceRegex, (match, idStr) => {
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

  const chartResult = processContentWithChart(sourceProcessText);

  return {
    content: chartResult.content,
    sourceButtons: sourceBt,
    chartButtons: chartResult.chartButtons
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
    const beforeText = resultText.slice(0, codeMap.get(start));
    const afterText = resultText.slice(codeMap.get(end));
    const placeholder = `{{ENTITY_${index}}}`;

    entityBts[placeholder] = entity;
    resultText = beforeText + placeholder + afterText;
  });

  return {
    content: resultText,
    entityButtons: entityBts
  };
}

/**
 * 处理深度消息内容
 * @param content 原始消息内容
 * @param entities 实体列表（可选）
 * @returns 处理后的数据，包含 processedContent 和各种按钮映射
 */
export async function processDeepMessage(
  content: string,
  entities= [] as EntityItem[]
): Promise<ProcessedMessageData> {
  let resultContent = content;
  let entityButtons: { [key: string]: EntityItem } = {};
  let sourceButtons: { [key: string]: number } = {};
  let chartButtons: { [key: string]: number } = {};

  // 1. 先处理实体（如果有）
  if (entities && entities.length > 0) {
    const entityResult = processContentWithEntities(resultContent, entities);
    resultContent = entityResult.content;
    entityButtons = entityResult.entityButtons;
  }

  // 2. 处理来源和图表
  const sourceResult = processContentWithSources(resultContent);
  resultContent = sourceResult.content;
  sourceButtons = sourceResult.sourceButtons;
  chartButtons = sourceResult.chartButtons;

  return {
    content: resultContent,
    entityButtons,
    sourceButtons,
    chartButtons,
    entities
  };
}
