# 本地开发时实现热更新（HMR）

当你在开发 React 库（如 pythra-sdk）并在测试项目中本地测试时，默认情况下修改库的代码不会触发测试项目的热更新。本文档提供了经过验证的解决方案。

## 问题描述

你有两个项目：
- **pythra-sdk**（库项目）：运行 `yarn build:watch` 或 `npm run build:watch`
- **测试项目**：运行 `yarn dev` 或 `npm run dev`

当你修改 pythra-sdk 的源代码时，虽然 SDK 会重新构建，但测试项目不会自动刷新或热更新。

## 核心问题

使用 `"pythra": "file:../pythra-sdk"` 方式时：
- npm/yarn 会在 `node_modules` 中创建库的**副本或浅链接**
- 当库代码更新时，`node_modules` 中的副本**不会自动同步**
- 必须修改 `package.json` 中的包名或版本号才能强制重新安装
- 每次改动都需要手动操作，非常不便

## 正确的解决方案：使用 yarn link / npm link

使用 `yarn link` 或 `npm link` 创建**真实的符号链接**，可以实时反映 SDK 的变化。

---

## Vite 项目（完整解决方案）

### 步骤 1: 配置库的 package.json

确保 pythra-sdk 的 `package.json` 配置正确：

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
  },
  "peerDependencies": {
    "react": ">=17"
  },
  "devDependencies": {
    "@types/react": "^19.2.7",
    "tsup": "^8.5.1",
    "typescript": "^5.9.3"
  }
}
```

**关键配置**：
- `exports` 字段明确指定 ESM 和 CJS 入口
- React 必须在 `peerDependencies` 中，不在 `dependencies` 中

### 步骤 2: 配置构建工具（tsup）

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
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js'
    }
  }
})
```

**说明**：
- `format: ["esm", "cjs"]` - 同时生成 ESM 和 CJS 格式
- `external: ["react"]` - 不打包 React
- `outExtension` - ESM 使用 `.mjs` 后缀，CJS 使用 `.js` 后缀

### 步骤 3: 创建符号链接

#### 在库项目（pythra-sdk）中创建全局链接

```bash
cd /path/to/pythra-sdk
yarn link
# 或
npm link
```

你会看到：
```
success Registered "pythra".
info You can now run `yarn link "pythra"` in the projects where you want to use this package.
```

#### 在测试项目中链接到库

```bash
cd /path/to/test-project
yarn link "pythra"
# 或
npm link pythra
```

你会看到：
```
success Using linked package for "pythra".
```

#### 验证符号链接

```bash
ls -la node_modules/pythra
```

应该看到类似这样的输出（符号链接）：
```
lrwxr-xr-x  1 user  staff  36 Dec 25 14:20 node_modules/pythra -> ../../../../.config/yarn/link/pythra
```

### 步骤 4: 配置 Vite

更新测试项目的 `vite.config.ts`：

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
      // 强制使用 ESM 版本
      'pythra': path.resolve(__dirname, './node_modules/pythra/dist/index.mjs'),
    },
    // 确保 Vite 能正确解析符号链接
    preserveSymlinks: false
  },
  server: {
    watch: {
      // 使用轮询模式确保检测到变化
      usePolling: true,
      interval: 1000, // 每秒检查一次
    }
  },
  optimizeDeps: {
    // 排除库，让 Vite 直接使用最新构建
    exclude: ['pythra']
  }
})
```

**关键配置说明**：

1. **`alias['pythra']`**: 强制 Vite 使用 ESM 版本（`.mjs`），避免加载 CJS 导致的导出错误
2. **`preserveSymlinks: false`**: 让 Vite 能正确跟踪符号链接的真实路径
3. **`watch.usePolling: true`**: 使用轮询模式监听文件变化，更可靠（虽然性能稍低）
4. **`optimizeDeps.exclude`**: 不预构建库，直接使用最新的构建文件

### 步骤 5: 清除缓存并启动

```bash
# 清除 Vite 缓存
rm -rf node_modules/.vite

# 启动开发服务器
yarn dev
```

### 步骤 6: 启动库的 watch 模式

在 pythra-sdk 目录：

```bash
yarn build:watch
# 或
npm run build:watch
```

### 验证热更新

1. 修改 `pythra-sdk/src/hooks/useDeepHistory.ts`：
   ```typescript
   console.log('🎉 热更新测试！', msg)
   ```

2. 观察：
   - pythra-sdk 终端显示重新构建
   - 等待约 1 秒（轮询间隔）
   - 测试项目浏览器自动刷新
   - 控制台显示新的日志

---

## Next.js 项目

### 使用 yarn link / npm link（推荐）

步骤 1-3 与 Vite 相同，然后配置 `next.config.js`：

```javascript
const path = require('path')

module.exports = {
  // Next.js 13+ 使用 transpilePackages
  transpilePackages: ['pythra'],

  webpack: (config, { isServer }) => {
    // 配置 alias 强制使用 ESM
    config.resolve.alias = {
      ...config.resolve.alias,
      'pythra': path.resolve(__dirname, './node_modules/pythra/dist/index.mjs'),
    }

    // 监听符号链接的变化
    if (!isServer) {
      config.snapshot = {
        ...config.snapshot,
        managedPaths: []
      }
    }

    return config
  }
}
```

### 启动开发服务器

```bash
# 删除缓存
rm -rf .next

# 启动
npm run dev
```

---

## React Native 项目

### 使用 yarn link / npm link

步骤 1-3 与 Vite 相同，然后配置 `metro.config.js`：

```javascript
const path = require('path')
const { getDefaultConfig } = require('@react-native/metro-config')
const fs = require('fs')

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname)

  // 解析符号链接的真实路径
  const pythraPath = fs.realpathSync(
    path.resolve(__dirname, 'node_modules/pythra')
  )

  return {
    ...defaultConfig,
    watchFolders: [pythraPath],
    resolver: {
      ...defaultConfig.resolver,
      extraNodeModules: {
        'pythra': pythraPath
      }
    }
  }
})()
```

### 启动应用

```bash
# 清除缓存并启动
npx react-native start --reset-cache

# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

---

## Expo 项目

### 使用 yarn link / npm link

步骤 1-3 与 Vite 相同，然后配置 `metro.config.js`：

```javascript
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// 添加 watchFolders 监听库目录
config.watchFolders = [
  path.resolve(__dirname, 'node_modules/pythra')
]

// 配置 resolver
config.resolver.extraNodeModules = {
  'pythra': path.resolve(__dirname, 'node_modules/pythra')
}

module.exports = config
```

### 启动应用

```bash
# 清除缓存
expo start -c

# 或使用开发构建（推荐）
expo prebuild
expo run:ios  # 或 expo run:android
```

---

## 取消链接（恢复正常依赖）

当你不再需要本地开发时，可以取消链接：

### 在测试项目中

```bash
yarn unlink pythra
# 或
npm unlink pythra

# 然后重新安装
yarn install
# 或
npm install
```

### 在库项目中（可选）

```bash
yarn unlink
# 或
npm unlink
```

---

## 常见问题

### Q: 为什么不直接用 `"pythra": "file:../pythra-sdk"`？

A: `file:` 协议会创建副本或浅链接，不会实时同步更新。每次修改都需要改 `package.json` 才能生效，非常不便。

### Q: yarn link 后热更新还是不生效怎么办？

A: 检查以下几点：
1. 确认库的 watch 模式正在运行（`yarn build:watch`）
2. 确认 Vite 配置了 `usePolling: true`
3. 清除缓存：`rm -rf node_modules/.vite`
4. 重启开发服务器
5. 在浏览器中硬刷新（Cmd+Shift+R 或 Ctrl+Shift+R）

### Q: 符号链接在 Windows 上是否有效？

A: 是的，但 Windows 需要管理员权限创建符号链接。建议：
- 以管理员身份运行终端
- 或使用 WSL2（推荐）

### Q: 如何检查符号链接是否正确？

A: 运行以下命令：
```bash
ls -la node_modules/pythra
# 应该看到 -> 符号，表示这是一个链接

# 或查看真实路径
realpath node_modules/pythra
# 应该指向你的 pythra-sdk 目录
```

### Q: 热更新延迟很高怎么办？

A: 调整 Vite 配置中的轮询间隔：
```typescript
server: {
  watch: {
    usePolling: true,
    interval: 500, // 减少到 500ms
  }
}
```

注意：间隔越小，CPU 占用越高。

### Q: 部署到生产环境时需要注意什么？

A:
1. 在 CI/CD 中不要使用 `yarn link`，使用正常的 `npm install`
2. 发布到 npm 后，用户正常安装不需要任何特殊配置
3. 本地开发完成后，记得 `yarn unlink` 恢复正常依赖

---

## 调试技巧

### 1. 验证构建文件是否更新

```bash
# 查看文件修改时间
ls -lt pythra-sdk/dist/

# 查看文件内容
cat pythra-sdk/dist/index.mjs | grep "你的修改内容"
```

### 2. 检查浏览器加载的文件

1. 打开浏览器开发者工具
2. 切换到 **Network** 标签
3. 勾选 **Disable cache**
4. 刷新页面
5. 查找 `pythra` 或 `index.mjs` 的请求
6. 查看返回的文件内容是否包含最新修改

### 3. 强制 Vite 重新加载

在 Vite 开发服务器的终端中按 `r` 键，手动触发完全重新加载。

---

## 总结

根据你的项目类型选择对应的配置方案：

| 项目类型 | 配置难度 | 核心要点 |
|---------|---------|---------|
| Vite | ⭐⭐ 中等 | `yarn link` + alias + `usePolling` + `exclude` |
| Next.js | ⭐⭐ 中等 | `yarn link` + `transpilePackages` + webpack alias |
| React Native | ⭐⭐⭐ 较难 | `yarn link` + Metro `watchFolders` + `--reset-cache` |
| Expo | ⭐⭐ 中等 | `yarn link` + Metro config + `expo start -c` |

**关键步骤总结**：
1. ✅ 配置库的 `package.json`（`exports`、`peerDependencies`）
2. ✅ 配置构建工具（tsup 生成 `.mjs` 和 `.js`）
3. ✅ **使用 `yarn link` 创建符号链接**（最关键！）
4. ✅ 配置测试项目（alias、轮询、exclude）
5. ✅ 清除缓存并启动
6. ✅ 启动库的 watch 模式

配置完成后，你就可以享受无缝的开发体验：修改库代码 → 自动构建 → 测试项目自动更新！
