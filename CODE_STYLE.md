# 代码格式化和检查工具配置

本项目已配置了最新版本的代码格式化和代码检查工具，包括：

## 已安装的工具

- **ESLint** (v9.32.0) - 代码质量检查
- **Prettier** (v3.3.3) - 代码格式化
- **TypeScript ESLint** - TypeScript 代码检查
- **Prettier ESLint 集成** - 格式化和检查工具集成

## 可用的 npm 脚本

```bash
# 检查代码质量问题
npm run lint

# 自动修复可修复的代码质量问题
npm run lint:fix

# 格式化所有代码文件
npm run format

# 检查代码格式是否符合规范
npm run format:check

# TypeScript 类型检查
npm run typecheck
```

## 配置文件说明

- `eslint.config.js` - ESLint v9 配置文件
- `.prettierrc.js` - Prettier 格式化规则
- `.prettierignore` - Prettier 忽略文件列表
- `.vscode/settings.json` - VSCode 编辑器配置
- `.vscode/extensions.json` - 推荐的 VSCode 扩展

## VSCode 集成

项目已配置 VSCode 自动格式化和代码检查：

- 保存时自动格式化代码
- 保存时自动修复 ESLint 问题
- 推荐安装相关扩展插件

## 支持的文件类型

- JavaScript (.js)
- TypeScript (.ts)
- Solidity (.sol) - 仅格式化，不进行 ESLint 检查
- JSON 文件
- Markdown 文件

## 注意事项

1. Solidity 文件使用专门的格式化规则（4 空格缩进，120 字符行宽）
2. ESLint 仅检查 JavaScript 和 TypeScript 文件
3. 所有配置文件都使用最新版本的工具
4. 项目构建产物目录（artifacts/, cache/ 等）已被忽略

## 开发建议

1. 在提交代码前运行 `npm run lint` 和 `npm run format:check`
2. 使用 `npm run lint:fix` 自动修复常见问题
3. 安装推荐的 VSCode 扩展以获得最佳开发体验
