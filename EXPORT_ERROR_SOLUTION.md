# 解决 "does not provide an export" 错误

## 问题描述

在使用本地链接的 pythra-sdk 时，测试项目报错：

```
Uncaught SyntaxError: The requested module '/node_modules/pythra-sdk/dist/index.js'
does not provide an export named 'useDeepHistory'
```

或类似的导出错误：

```
Attempted import error: 'useDeepHistory' is not exported from 'pythra-sdk'
```

## 问题根源

这个错误通常由以下原因引起：

1. **package.json 的 `main`/`module` 字段指向错误的文件**
2. **构建工具生成的文件格式与 package.json 配置不匹配**
3. **ESM 和 CJS 文件混淆**
4. **导出语法配置错误**

---

## 快速诊断

### 步骤 1: 检查构建输出

```bash
cd pythra-sdk
ls -la dist/
```

常见的构建输出文件：
- `index.js` - CommonJS 格式
- `index.mjs` - ES Module 格式
- `index.cjs` - CommonJS 格式（明确后缀）
- `index.d.ts` - TypeScript 类型定义

### 步骤 2: 检查文件内容

查看构建后的文件开头：

```bash
head -n 20 dist/index.js
head -n 20 dist/index.mjs
```

**CommonJS 格式** (`.js` / `.cjs`) 应该包含：
```javascript
"use strict";
// ... 或
module.exports = ...
// ... 或
exports.useDeepHistory = ...
```

**ES Module 格式** (`.mjs`) 应该包含：
```javascript
export { useDeepHistory }
// ... 或
export * from "./hooks/useDeepHistory"
```

### 步骤 3: 检查 package.json

```json
{
  "main": "dist/index.js",    // CommonJS 入口
  "module": "dist/index.mjs", // ES Module 入口
  "types": "dist/index.d.ts"  // TypeScript 类型
}
```

---

## 解决方案

### 方案 1: 修正 package.json 字段（最常见）

#### 问题：`module` 字段指向了 CJS 文件

❌ **错误配置**：
```json
{
  "main": "dist/index.cjs",
  "module": "dist/index.js"  // 实际上这是 CJS 文件！
}
```

✅ **正确配置**：
```json
{
  "main": "dist/index.js",   // CJS 文件
  "module": "dist/index.mjs" // ESM 文件
}
```

#### 如何判断文件格式？

查看文件内容：
```bash
# 如果看到 "use strict" 或 module.exports，这是 CJS
head -n 5 dist/index.js

# 如果看到 export，这是 ESM
head -n 5 dist/index.mjs
```

---

### 方案 2: 使用现代 exports 字段（推荐）

对于现代项目，推荐使用 `exports` 字段（Node.js 12.7+）：

```json
{
  "name": "pythra",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "default": "./dist/index.mjs"
    }
  }
}
```

**说明**：
- `import`: 使用 ESM 导入时（`import { useDeepHistory } from 'pythra-sdk'`）
- `require`: 使用 CJS 导入时（`const { useDeepHistory } = require('pythra-sdk')`）
- `types`: TypeScript 类型文件
- `default`: 默认导出

**⚠️ Vite 特殊情况**：

即使配置了 `exports` 字段，在使用 `optimizeDeps.exclude` 时，Vite 可能仍然会错误地使用 `main` 字段（CJS 文件）。需要额外配置 alias：

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      // 强制 Vite 使用 ESM 版本
      'pythra-sdk': path.resolve(__dirname, './node_modules/pythra-sdk/dist/index.mjs'),
    }
  },
  optimizeDeps: {
    exclude: ['pythra-sdk']
  }
})
```

这个配置确保 Vite 始终使用 `.mjs` 文件，避免 "does not provide an export" 错误。

---

### 方案 3: 统一使用一种格式（简化方案）

如果只支持 ESM（适用于现代项目）：

#### package.json
```json
{
  "type": "module",
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.mjs"
    }
  }
}
```

#### tsup.config.ts
```typescript
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],  // 只构建 ESM
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-native"]
})
```

**注意**：这种方案不支持 CommonJS 环境（如某些老旧的 Node.js 项目）。

---

## 不同构建工具的配置

### 1. tsup (推荐)

#### 双格式输出（ESM + CJS）

```typescript
// tsup.config.ts
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-native"],
  // 确保正确的文件扩展名
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js'
    }
  }
})
```

#### package.json
```json
{
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts"
}
```

---

### 2. Rollup

```javascript
// rollup.config.js
import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'  // 重要：使用命名导出
    },
    {
      file: 'dist/index.mjs',
      format: 'es',
      sourcemap: true
    }
  ],
  external: ['react', 'react-native'],
  plugins: [
    typescript({
      declaration: true,
      declarationDir: 'dist'
    })
  ]
}
```

---

### 3. Webpack

```javascript
// webpack.config.js
const path = require('path')

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: {
      type: 'umd',
      name: 'PythraSDK'
    },
    globalObject: 'this'
  },
  externals: {
    react: 'react',
    'react-native': 'react-native'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
}
```

---

### 4. esbuild

```javascript
// build.js
const esbuild = require('esbuild')

// ESM 构建
esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.mjs',
  format: 'esm',
  external: ['react', 'react-native'],
  sourcemap: true
})

// CJS 构建
esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'cjs',
  external: ['react', 'react-native'],
  sourcemap: true
})
```

---

## React Native / Expo 特殊情况

### Metro Bundler 配置

React Native 使用 Metro bundler，它对模块格式有特殊要求。

#### package.json (React Native 友好)

```json
{
  "main": "dist/index.js",
  "react-native": "dist/index.js",  // Metro 优先使用这个字段
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts"
}
```

#### 如果使用源码导出（不构建）

某些 React Native 库直接导出源码：

```json
{
  "main": "src/index.ts",
  "react-native": "src/index.ts",
  "types": "src/index.ts"
}
```

然后在使用方配置 Metro 转译：

```javascript
// metro.config.js
module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json']
  }
}
```

---

### Expo 配置

对于 Expo 项目，确保 package.json 包含正确的入口：

```json
{
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "react-native": "dist/index.js",
  "types": "dist/index.d.ts",
  "sideEffects": false
}
```

如果使用原生模块，还需要配置：

```json
{
  "expo": {
    "platforms": ["ios", "android"]
  }
}
```

---

## 验证修复

### 1. 重新构建库

```bash
cd pythra-sdk
rm -rf dist
yarn build
# 或
npm run build
```

### 2. 检查生成的文件

```bash
ls -la dist/
cat dist/index.mjs | head -n 20
cat dist/index.js | head -n 20
```

确保：
- `index.mjs` 包含 `export { useDeepHistory }`
- `index.js` 包含 `module.exports` 或 `exports.useDeepHistory`

### 3. 在测试项目中验证

```bash
cd test-project
rm -rf node_modules/.vite  # Vite
rm -rf .next               # Next.js
rm -rf node_modules/.cache # 其他缓存

yarn dev
```

### 4. 测试导入

在测试项目中创建测试文件：

```typescript
// test-import.ts
import { useDeepHistory } from 'pythra-sdk'

console.log('Import success:', useDeepHistory)
```

运行：
```bash
node test-import.ts
```

如果没有错误，说明导出配置正确。

---

## 常见错误案例

### 案例 1: tsup 配置错误

❌ **错误**：
```typescript
export default defineConfig({
  format: ["esm", "cjs"],
  // 缺少 outExtension 配置
})
```

结果：两个格式都输出为 `.js` 后缀，导致冲突。

✅ **修正**：
```typescript
export default defineConfig({
  format: ["esm", "cjs"],
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js'
    }
  }
})
```

---

### 案例 2: 忘记导出

❌ **错误**：
```typescript
// src/index.ts
import { useDeepHistory } from "./hooks/useDeepHistory"

// 忘记导出！
```

✅ **修正**：
```typescript
// src/index.ts
export { useDeepHistory } from "./hooks/useDeepHistory"
// 或
export * from "./hooks/useDeepHistory"
```

---

### 案例 3: 默认导出 vs 命名导出混淆

❌ **库中使用默认导出**：
```typescript
// src/hooks/useDeepHistory.ts
export default function useDeepHistory() { ... }
```

❌ **用户使用命名导出**：
```typescript
import { useDeepHistory } from 'pythra-sdk'  // 错误！
```

✅ **修正方案 1** - 改为命名导出：
```typescript
// src/hooks/useDeepHistory.ts
export function useDeepHistory() { ... }
```

✅ **修正方案 2** - 用户使用默认导出：
```typescript
import useDeepHistory from 'pythra-sdk'
```

**推荐**：React hooks 库通常使用命名导出。

---

## 调试技巧

### 1. 使用 Node.js 直接测试

```bash
cd test-project
node
```

```javascript
// 在 Node REPL 中
const pkg = require('pythra-sdk')
console.log(pkg)  // 查看导出内容
```

或使用 ESM：
```bash
node --input-type=module
```

```javascript
import * as pkg from 'pythra-sdk'
console.log(pkg)
```

### 2. 检查 package.json 解析

```bash
node -e "console.log(require.resolve('pythra-sdk'))"
```

这会显示实际解析到的文件路径。

### 3. 使用 publint 检查

安装工具：
```bash
npx publint
```

在 pythra-sdk 目录运行，它会检查 package.json 配置是否正确。

---

## 最佳实践总结

### ✅ DO（推荐做法）

1. **使用 tsup** - 简单可靠，自动处理 ESM/CJS
2. **明确指定文件扩展名** - `.mjs` 用于 ESM，`.js` 用于 CJS
3. **使用 `exports` 字段** - 现代且明确
4. **命名导出** - React hooks 的标准做法
5. **设置 `external`** - 不要打包 React
6. **生成 sourcemap** - 方便调试
7. **生成类型文件** - TypeScript 支持

### ❌ DON'T（避免做法）

1. ❌ 不要混用文件扩展名（ESM 也用 `.js`）
2. ❌ 不要忘记导出 (`export`)
3. ❌ 不要把 React 打包进库
4. ❌ 不要混用默认导出和命名导出
5. ❌ 不要忽略构建警告
6. ❌ 不要手动编写 `.d.ts` 文件

---

## 推荐配置模板

### 完整的 package.json

```json
{
  "name": "pythra",
  "version": "0.1.0",
  "description": "React hooks library",
  "author": "Your Name",
  "license": "MIT",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "react-native": "./dist/index.js",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "react-native": "./dist/index.js",
      "default": "./dist/index.mjs"
    },
    "./package.json": "./package.json"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "react": ">=17"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "react": "^18.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 完整的 tsup.config.ts

```typescript
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "react-native"],
  treeshake: true,
  splitting: false,
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js'
    }
  }
})
```

### 完整的 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2019",
    "module": "ESNext",
    "lib": ["ES2019"],
    "jsx": "react",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 实际案例：Vite + optimizeDeps.exclude 导致的错误

### 问题场景

你正在使用 Vite 开发，并配置了以下设置来实现本地开发的热更新：

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['pythra-sdk']  // 排除预构建，以便使用最新的构建文件
  }
})
```

但出现错误：

```
Uncaught SyntaxError: The requested module '/node_modules/pythra-sdk/dist/index.js'
does not provide an export named 'useDeepHistory'
```

### 问题分析

1. Vite 看到 `optimizeDeps.exclude`，跳过预构建
2. Vite 尝试解析 `pythra-sdk` 的入口文件
3. 即使 `package.json` 有 `module` 和 `exports` 字段，Vite 在某些情况下仍会使用 `main` 字段
4. `main` 指向 `dist/index.js`（CommonJS 格式）
5. Vite 的 ESM 环境无法正确解析 CommonJS 的 `module.exports`
6. 报错：没有提供命名导出

### 完整解决方案

#### 1. 库的 package.json

```json
{
  "name": "pythra",
  "version": "0.1.0",
  "main": "./dist/index.js",       // CJS 入口
  "module": "./dist/index.mjs",    // ESM 入口
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",  // ESM 导入使用这个
      "require": "./dist/index.js",  // CJS 导入使用这个
      "default": "./dist/index.mjs"
    }
  }
}
```

#### 2. 测试项目的 vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      // 🔑 关键：强制使用 ESM 版本
      'pythra-sdk': path.resolve(__dirname, './node_modules/pythra-sdk/dist/index.mjs'),
    }
  },
  server: {
    watch: {
      // 监听 pythra-sdk 的变化
      ignored: ['!**/node_modules/pythra-sdk/**']
    }
  },
  optimizeDeps: {
    exclude: ['pythra-sdk']
  }
})
```

#### 3. 清除缓存并重启

```bash
# 清除 Vite 缓存
rm -rf node_modules/.vite

# 重启开发服务器
yarn dev
```

### 验证修复

修改 `pythra-sdk/src/hooks/useDeepHistory.ts`：

```typescript
export function useDeepHistory() {
  console.log('🎉 Hot reload working!')  // 添加日志
  // ...
}
```

保存后，测试项目应该：
1. ✅ 不报错
2. ✅ 自动刷新
3. ✅ 控制台显示新的日志

---

## 总结

导出错误的主要原因是 **package.json 配置与实际构建文件不匹配**。解决步骤：

1. ✅ 检查 `dist/` 目录的文件名和格式
2. ✅ 确保 `main` 指向 CJS 文件（`.js`）
3. ✅ 确保 `module` 指向 ESM 文件（`.mjs`）
4. ✅ 使用 `exports` 字段明确声明入口
5. ✅ **Vite 项目：添加 alias 强制使用 `.mjs` 文件**
6. ✅ 清除缓存并重新构建
7. ✅ 在测试项目中验证导入

按照本文档的推荐配置，可以避免 99% 的导出问题！
