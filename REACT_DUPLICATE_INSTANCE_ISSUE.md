# 解决 React "Invalid Hook Call" 错误 - 多个 React 实例问题

## 问题描述

当你在开发一个 React 库（如 pythra-sdk）并在本地测试项目中使用时，可能会遇到以下错误：

```
Invalid hook call. Hooks can only be called inside of the body of a function component.
This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app

Uncaught TypeError: Cannot read properties of null (reading 'useState')
```

## 问题根源

这个问题的核心原因是：**项目中存在多个 React 实例**。

当你使用 `file:` 协议链接本地库时：
```json
{
  "dependencies": {
    "pythra-sdk": "file:../pythra-sdk"
  }
}
```

可能会出现以下情况：
1. `pythra-sdk` 的 `node_modules` 中安装了 React
2. `react-test` 项目的 `node_modules` 中也安装了 React
3. 打包工具在运行时加载了两个不同的 React 实例
4. 库中的 hooks 使用一个实例，而应用代码使用另一个实例
5. React 检测到 hooks 被"外部"调用，抛出错误

## 解决方案

### 步骤 1: 配置库的 package.json

在你的库项目（pythra-sdk）中，确保 React 被声明为 **peerDependency** 而不是 dependency：

```json
{
  "name": "pythra",
  "peerDependencies": {
    "react": ">=17",
    "react-native": ">=0.70"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": false
    },
    "react-native": {
      "optional": false
    }
  },
  "devDependencies": {
    "@types/react": "^19.2.7",
    // ... 其他开发依赖
  }
}
```

**重要提示：**
- **不要**把 React 放在 `dependencies` 中
- 使用 `peerDependencies` 告诉 npm 这个包需要使用宿主项目的 React
- 可以在 `devDependencies` 中添加 `@types/react` 用于 TypeScript 类型检查

### 步骤 2: 配置打包工具（tsup/rollup/webpack）

在打包库时，确保 React 被标记为 **external**（外部依赖），不会被打包进库的代码中。

#### 使用 tsup:

```typescript
// tsup.config.ts
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-native"] // 关键配置
})
```

#### 使用 Rollup:

```javascript
// rollup.config.js
export default {
  external: ['react', 'react-dom', 'react-native'],
  // ...
}
```

### 步骤 3: 清理库的 node_modules

如果之前已经安装过依赖，需要清理并重新安装：

```bash
cd pythra-sdk
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 步骤 4: 配置 Vite（测试项目）

在使用 Vite 的测试项目中，需要配置 `resolve.dedupe` 和 `resolve.alias` 来确保只使用一个 React 实例：

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // 确保 React 和 React DOM 只有一个实例
    dedupe: ['react', 'react-dom'],
    // 强制所有模块使用同一个 React
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    }
  }
})
```

**注意：** 需要在 package.json 中添加 `@types/node` 以使用 `path` 模块：

```bash
npm install -D @types/node
```

### 步骤 5: 清理测试项目并重新安装

```bash
cd react-test
rm -rf node_modules package-lock.json
npm install
```

### 步骤 6: 验证修复

运行以下命令检查 React 实例：

```bash
cd react-test
npm ls react
```

你应该看到类似这样的输出（所有 React 都是 `deduped`）：

```
react-test@0.0.0
├─┬ pythra-sdk@npm:pythra@0.1.0 -> ./../pythra-sdk
│ └── react@19.2.3 deduped
├─┬ react-dom@19.2.3
│ └── react@19.2.3 deduped
└── react@19.2.3
```

### 步骤 7: 重启开发服务器

```bash
npm run dev
```

## 其他打包工具的配置

### Webpack

```javascript
// webpack.config.js
module.exports = {
  externals: {
    react: 'react',
    'react-dom': 'react-dom'
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom')
    }
  }
}
```

### Next.js

```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    }
    return config
  }
}
```

### Expo / React Native (Metro Bundler)

在 Expo 或 React Native 项目中使用本地库时，需要配置 Metro bundler：

```javascript
// metro.config.js
const { getDefaultConfig } = require("@expo/metro-config");
const path = require('node:path');

const config = getDefaultConfig(__dirname);

// 添加 pythra-sdk 的 watchFolders
const pythraPath = path.resolve(__dirname, '../pythra-sdk');
config.watchFolders = [pythraPath];

// 配置解析器
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// 关键配置：强制使用主项目的 React 和 React Native 实例
config.resolver.extraNodeModules = {
  'pythra-sdk': pythraPath,
  'react': path.resolve(__dirname, 'node_modules/react'),
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
};

module.exports = config;
```

**额外步骤：清理库的 React 依赖**

即使配置了 `peerDependencies`，库的 `node_modules` 中可能仍然安装了 React。需要手动删除：

```bash
# 删除库中的 React 相关依赖
cd pythra-sdk
rm -rf node_modules/react node_modules/react-native node_modules/@react-native

# 重新构建
npm run build

# 清除 Expo 缓存
cd ../your-expo-app
rm -rf node_modules/.cache .expo

# 重启开发服务器（带缓存清理）
npx expo start -c
```

**可选：清除 watchman 缓存**

如果仍有问题，可能需要清除 watchman 缓存：

```bash
watchman watch-del-all
```

## 原理解释

### 为什么会有多个 React 实例？

1. **npm/yarn 的依赖解析机制：** 当库有自己的 `node_modules/react` 时，JavaScript 的模块解析会找到这个独立的 React 实例
2. **打包工具的模块解析：** 如果没有正确配置，Vite/Webpack 可能会从不同路径导入 React
3. **React 的单例设计：** React Hooks 依赖内部状态，必须使用同一个 React 实例

### dedupe vs alias 的区别

- **`dedupe`**: 告诉 Vite 对这些包去重，优先使用已解析的版本
- **`alias`**: 强制所有对 React 的导入都解析到指定路径，更强硬的方式

两者结合使用可以最大程度确保只有一个 React 实例。

## 调试技巧

### 1. 检查 React 实例数量

在你的组件中临时添加：

```javascript
import React from 'react'
console.log('React instance:', React)
```

如果看到不同的对象引用或警告，说明有多个实例。

### 2. 使用 npm ls 检查依赖树

```bash
npm ls react
npm ls react-dom
```

查找是否有未 `deduped` 的 React。

### 3. 检查打包输出

查看库的打包文件（`dist/index.js`），确保没有包含 React 的代码：

```bash
grep -n "useState" dist/index.js
```

如果找到 React 的实现代码（而不是导入），说明 React 被打包进去了。

## 发布到 npm 后的注意事项

当你将库发布到 npm 后，用户通过 `npm install pythra-sdk` 安装时，由于正确配置了 `peerDependencies` 和 `external`：

1. npm 会提示用户需要安装 React（如果没有的话）
2. pythra-sdk 不会自带 React 代码
3. 自动使用用户项目中的 React 实例
4. 通常不需要额外的 Vite/Webpack 配置

但在**本地开发时使用 `file:` 协议链接**，必须要手动配置 dedupe 和 alias。

## 总结

解决 React 多实例问题的关键：

1. ✅ 库使用 `peerDependencies` 而不是 `dependencies`
2. ✅ 打包时设置 `external: ['react']`
3. ✅ 清理库的 `node_modules`
4. ✅ 在测试项目中配置 `dedupe` 和 `alias`
5. ✅ 重启开发服务器

这样可以确保整个应用只有一个 React 实例，hooks 可以正常工作。
