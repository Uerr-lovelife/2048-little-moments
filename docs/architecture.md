# 架构与修改入口

## 依赖方向

```text
键盘 / 滑动 / 按钮
         ↓
src/main.js ─── src/style.css
    ├── src/game.js      纯规则与随机生成
    └── src/storage.js   存档验证与容错
```

规则与存档模块不依赖界面，也不直接读取 `window`。因此可以在 Node 中测试，或作为其他前端、游戏引擎和移动端容器的逻辑基础。

## 核心接口

`state` 的结构为：

```js
{
  board: [[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 2]],
  score: 0,
  moves: 0,
  continued: false
}
```

| 接口 | 职责 |
| --- | --- |
| `newGame(random = Math.random)` | 返回初始状态，生成两个方块 |
| `moveBoard(board, direction)` | 返回新棋盘、得分、是否变化、位移记录和合并位置；不生成新数字 |
| `spawnTile(board, random = Math.random)` | 在空格生成 2 或 4，返回棋盘及生成位置 |
| `playTurn(state, direction, random = Math.random)` | 完成一次有效移动、计分、计步和生成 |
| `getStatus(state)` | 返回 `playing`、`won` 或 `over` |
| `loadGame(storage)` | 从 Storage 读取并验证，返回 `{ state, best }` |
| `saveGame(storage, state, best)` | 保存并返回是否成功，失败不向外抛错 |

`direction` 只能传 `left`、`right`、`up`、`down`。界面层负责把输入转换成这些值。棋盘为 4×4，空格为 0，其他值为 2 的正整数次幂。

## 一次移动

1. 界面先检查游戏状态及动画锁。
2. `playTurn` 调用 `moveBoard`。四个方向共用按方向读取一行、压缩空位、合并相邻数字的逻辑。
3. 没有变化时不生成、不加分、不计步，也不消耗随机数。
4. 有变化时生成一个新方块并返回完整状态。界面先保存状态，再根据位移记录播放动画。
5. 动画结束后显示最终棋盘，并判断是否展示获胜或结束提示。

数据决定结果，动画只负责展示。动画期间忽略额外移动；新游戏增加 `generation`，旧动画结束时发现编号已过期便放弃更新，避免上一局覆盖新一局。

## 存档

键名为 `little-moments-2048-v1`，结构为 `{ version: 1, state, best }`。存档属于浏览器的 origin：协议、主机或端口改变时会形成独立存档。

读取时验证 4×4 结构、方块值、非负安全整数分数和步数，以及布尔标记。错误 JSON、全空棋盘和不支持的版本回退到新游戏，尽可能保留有效最高分。读取或写入异常不会中断游戏。

## 移植与扩展

- 换主题：主要修改 `src/style.css`。
- 改页面布局或文案：修改 `index.html`，必要时调整 `src/main.js` 的选择器。
- 改合并规则：修改 `src/game.js` 并先补 `tests/game.test.js`。
- 换存档介质：为 `loadGame` / `saveGame` 提供具有 `getItem`、`setItem` 的适配器。
- 移植到其他框架：复用规则与存档模块，重写输入和渲染层。
- 改棋盘尺寸：同时修改规则中的尺寸、存档验证、布局、说明和测试；当前版本并非可配置尺寸引擎。

框架和打包器不会替你迁移已有浏览器存档。发布域名或存档结构改变时，应单独规划迁移。
