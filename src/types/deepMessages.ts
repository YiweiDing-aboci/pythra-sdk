import { Dispatch, SetStateAction } from "react"

/**
 * Human message in deep conversation
 */
export interface DeepHumanMessage {
  type: "human"
  id: string
  content: string
}

/**
 * Todo item in deep conversation step
 */
export interface TodoItem {
  content: string
  status: "completed" | "in_progress" | "pending"
  activeForm: string
}

/**
 * Web search result item
 */
export interface WebSearchItem {
  pageContent: string
  metadata: {
    title: string
    url: string
  }
}

/**
 * Validation item in deep conversation
 */
export interface Validate {
  id: string
  content: string
}

/**
 * Step in deep conversation thinking process
 */
export interface DeepStep {
  status: "doing" | "done"
  title: string
  content: string
  todoList?: TodoItem[]
  sources?: WebSearchItem[]
  validates?: Validate[]
  results?: string
}

export interface EntityItem {
  text: string;
  type: string;
  start: number;
  end: number;
  language: string;
  context: any;
}

export interface ProcessedMessageData {
  content: string;
  entityButtons: { [key: string]: EntityItem };
  sourceButtons: { [key: string]: number };
  chartButtons: { [key: string]: number };
  jsonButtons: { [key: string]: any };
  entities: EntityItem[];
}

/**
 * Bot message in deep conversation
 */
export interface DeepBotMessage {
  type: "bot"
  id: string
  content: string
  isThinking?: boolean
  isCreating?: boolean
  processData: ProcessedMessageData
  head?: {
    title: string
    description: string
  }
  steps?: DeepStep[]
  sources?: WebSearchItem[]
}

/**
 * Union type for all deep conversation messages
 */
export type DeepMessage = DeepHumanMessage | DeepBotMessage

/**
 * Setter function type for deep messages
 */
export type DeepSetMessage = Dispatch<SetStateAction<DeepMessage[]>>
