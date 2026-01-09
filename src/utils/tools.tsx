import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export function extractDomain(url: string) {
    try {
        const hostname = new URL(url).hostname; 
        const parts = hostname.split('.');

        if (parts.length < 2) return null;

        // 处理像 com.my / com.cn 的二级后缀
        const sldTlds = ['com', 'co', 'net', 'org']; 

        // 如果倒数第二个是常见 TLD，则主域名在倒数第三个
        if (sldTlds.includes(parts[parts.length - 2]) && parts.length >= 3) {
            return parts[parts.length - 3];
        }

        // 否则直接取倒数第二个
        return parts[parts.length - 2];
    } catch (e) {
        return null;
    }
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  
  // 获取日期部分
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // 获取时间部分
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  // 格式化成 "12.02 21:08"
  return `${day}.${month} ${hours}:${minutes}`;
}

export function formatDate(input: string | number | Date): string {
  let date: Date;

  if (input instanceof Date) {
    date = input;
  } else if (typeof input === "number" || /^[0-9]+$/.test(input)) {
    const ts = Number(input);
    date = new Date(ts);
  } else {
    date = new Date(input);
  }

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date input");
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());

  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
}



export const formatTimeAgo = (timeString: string): string => {
  try {
    const eventTime = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - eventTime.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  } catch {
    return timeString; // 如果解析失败，返回原始时间字符串
  }
};

export function extractPlainText(markdown: string): string {
  return markdown
    .replace(/[*#`_~\[\]()]/g, '') // 移除 markdown 格式字符
    .replace(/\n/g, '') // 移除换行
    .trim()
    .slice(0, 50);
}

export function rem(size: number): number {
  const scale = width / 375;
  return size * scale;
}