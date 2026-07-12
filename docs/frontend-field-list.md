# Outbound-Guard 前端字段清单

请全员在 2026-07-12 18:00 前确认。本文用于前端、后端与法学队友对齐字段口径，确认页面展示字段、接口字段、法理数据结构和本地知识库结构是否一致。

## 1. 页面范围

| 页面 | 路由 | 字段类型 | 说明 |
|---|---|---|---|
| 首页 | `/` | 本地配置字段 | 项目介绍与功能入口卡片 |
| 品牌提交页 | `/submit` | 用户输入字段 | 用户提交品牌、类别、图片与补充说明 |
| 审查中页面 | `/reviewing` | 状态流转字段 | 审查任务状态、当前步骤与进度 |
| 报告页 | `/report` | 后端返回/本地知识库字段 | 汇总结论、绝对驳回、相对驳回、视觉相似度、法律建议 |

## 2. 首页字段

| 字段名 | 中文名 | 类型 | 来源 | 说明 |
|---|---|---|---|---|
| appTitle | 应用标题 | string | 本地配置 | 当前展示为“Outbound-Guard 越南商标合规智能体” |
| appDescription | 应用简介 | string | 本地配置 | 2-3 行说明，介绍商标合规扫描工作台 |
| capabilityCards | 功能入口卡片 | array | 本地配置 | 首页 3 张 Card 数据 |
| capabilityCards[].title | 功能标题 | string | 本地配置 | 商标合规扫描/法律风险预警/防御文书生成 |
| capabilityCards[].description | 功能说明 | string | 本地配置 | 对应功能的短描述 |
| capabilityCards[].iconKey | 图标标识 | string | 本地配置 | 前端映射 Ant Design Icon，不建议后端返回组件 |
| capabilityCards[].actionRoute | 操作跳转路由 | string | 本地配置 | 当前均跳转到 `/submit` |

## 3. 品牌提交页字段（用户输入 -> 后端接收）

| 字段名 | 中文名 | 类型 | 来源 | 说明 |
|---|---|---|---|---|
| brandName | 品牌名称 | string | 用户输入 | 支持中文/越南语，建议 1-50 字符 |
| niceClass | 尼斯分类 | string | 用户选择 | 下拉选择，建议统一为 1-45 类；当前前端示例值为 `43`/`25`/`30` |
| trademarkImage | 商标图片 | File | 用户上传 | JPG/PNG，建议 <=5MB；当前前端使用 Upload Dragger，后续可转 Base64 或 FormData |
| additionalInfo | 附加说明 | string | 用户输入 | 选填，建议 <=200 字符；当前代码字段名为 `notes`，建议统一改为 `additionalInfo` |

## 4. 审查中页面字段（后端 -> 前端状态推送）

| 字段名 | 中文名 | 类型 | 来源 | 说明 |
|---|---|---|---|---|
| taskId | 审查任务 ID | string | 后端生成 | UUID，用于轮询或订阅审查结果 |
| status | 审查状态 | enum | 后端返回 | 可选值：`pending`/`processing`/`done`/`error` |
| currentStep | 当前步骤 | number | 后端返回 | 0=法条规则匹配，1=多模态视觉比对，2=风险综合评估 |
| progress | 进度百分比 | number | 后端返回 | 0-100 |
| estimatedSeconds | 预计剩余秒数 | number | 后端返回 | 可选字段；用于替换当前页面静态文案“预计耗时 3-5 秒” |
| errorMessage | 错误信息 | string | 后端返回 | 可选字段；`status=error` 时展示 |

## 5. 报告页-汇总结论字段

| 字段名 | 中文名 | 类型 | 来源 | 说明 |
|---|---|---|---|---|
| summary | 报告汇总 | object | 后端返回 | 报告页顶部摘要卡片 |
| summary.brandName | 品牌名称 | string | 用户输入/后端返回 | 当前 mock 为“墨兰奶白” |
| summary.niceClass | 尼斯分类 | string | 用户输入/后端返回 | 当前 mock 为“第43类-餐饮服务” |
| summary.submitTime | 提交时间 | string | 后端返回 | 建议 ISO 8601 或统一 `YYYY-MM-DD HH:mm` |
| summary.riskLevel | 风险等级 | enum | 后端返回 | 可选值：`high`/`medium`/`low` |
| summary.riskScore | 风险分值 | number | 后端返回 | 0-100 |
| summary.overallResult | 总体结论 | string | 后端返回 | 一句话风险结论，供 Alert 展示 |

## 6. 报告页-绝对驳回分析字段

| 字段名 | 中文名 | 类型 | 来源 | 说明 |
|---|---|---|---|---|
| absolute | 绝对驳回分析 | object | 后端返回 | 当前前端 mock 模块名 |
| absolute.hasRisk | 是否触发绝对驳回 | boolean | 后端返回 | true=有风险；用户给定契约名为 `hasAbsoluteRisk`，建议二选一统一 |
| absolute.rejectionProbability | 驳回概率 | number | 后端返回 | 0-100 百分比 |
| absolute.articles | 法条列表 | array | 后端返回/本地知识库 | 见下方法条子结构 |
| absolute.articles[].article | 法条编号 | string | 本地知识库 | 如“越南《工业产权法》第74.2(a)条” |
| absolute.articles[].content | 法条内容 | string | 本地知识库 | 法条原文摘要或结构化摘要 |
| absolute.articles[].applicable | 是否适用 | boolean | 后端判断 | 规则引擎输出 |
| absolute.articles[].note | 审查说明 | string | 后端返回 | 说明为什么适用/不适用 |

待法学 B 确认：法条编号体系是否与越南《工业产权法》第72-76条对应？`articles` 是否需要增加 `fullText`（法条全文）、`sourceUrl`（来源链接）、`effectiveDate`（生效日期）？

## 7. 报告页-相对驳回分析字段

| 字段名 | 中文名 | 类型 | 来源 | 说明 |
|---|---|---|---|---|
| relative | 相对驳回分析 | object | 后端返回 | 当前前端 mock 模块名 |
| relative.hasRisk | 是否触发相对驳回 | boolean | 后端返回 | true=有风险；用户给定契约名为 `hasRelativeRisk`，建议二选一统一 |
| relative.conflicts | 冲突品牌列表 | array | 后端返回/本地数据库 | 从商标库匹配得到 |
| relative.conflicts[].brandName | 冲突品牌名 | string | 本地数据库 | 如“Louis Vuitton” |
| relative.conflicts[].registeredClass | 注册类别 | string | 本地数据库 | 如“全类注册（含第43类）” |
| relative.conflicts[].registrationNo | 注册号 | string | 本地数据库 | WIPO/NOIP 来源编号 |
| relative.conflicts[].similarityType | 相似类型 | string | 后端返回 | 如“图形相似-四叶花卉几何结构” |
| relative.conflicts[].similarityScore | 相似度评分 | number | 后端返回 | 0-100 |
| relative.precedents | 判例列表 | array | 后端返回/本地知识库 | 用于解释相对驳回风险 |
| relative.precedents[].caseName | 案件名 | string | 本地知识库 | 判例名称 |
| relative.precedents[].court | 审理法院 | string | 本地知识库 | 如“苏州市中级人民法院” |
| relative.precedents[].date | 裁判日期 | string | 本地知识库 | 建议统一 `YYYY-MM-DD` |
| relative.precedents[].ruling | 判决摘要 | string | 本地知识库 | 判决结果与核心理由摘要 |
| relative.precedents[].relevance | 关联性说明 | string | 后端返回 | 说明为什么与本案相关 |

待法学 A 确认：`conflicts` 数据是否来自 `trademark_db.json`？字段名是否与数据库一致？`registrationNo` 格式是否按 WIPO/NOIP 原始编号保留？

待法学 C 确认：`precedents` 判例数据的采集来源和字段结构？是否需要增加 `fullText`（判决书全文）、`sourceUrl`（判决来源）、`jurisdiction`（法域）？

## 8. 报告页-视觉相似度字段

| 字段名 | 中文名 | 类型 | 来源 | 说明 |
|---|---|---|---|---|
| visual | 视觉相似度分析 | object | 后端返回 | 当前前端 mock 模块名 |
| visual.radarData | 雷达图数据 | array | 后端返回 | 多模态模型输出 |
| visual.radarData[].dimension | 维度名 | string | 后端返回 | 当前为几何轮廓/色彩构成/线条密度/对称性/视觉重心 |
| visual.radarData[].target | 上传商标得分 | number | 后端返回 | 0-100 |
| visual.radarData[].benchmark | 对标品牌得分 | number | 后端返回 | 0-100 |
| visual.matchedBrands | 匹配品牌列表 | array | 后端返回 | 用于右侧相似品牌对标 |
| visual.matchedBrands[].name | 品牌名 | string | 后端返回/本地数据库 | 当前 mock 为“Louis Vuitton 四叶花卉” |
| visual.matchedBrands[].thumbnailUrl | 缩略图 URL | string | 后端返回/本地资源 | 对标商标图片；当前前端使用本地 `/lv-placeholder.svg` |
| visual.matchedBrands[].matchScore | 匹配分值 | number | 后端返回 | 0-100 |

待全员确认：`radarData` 的 5 个维度名称是否固定？如需可扩展，前端可直接按数组动态渲染，但后端需要保证 `dimension` 名称稳定可读。

## 9. 报告页-法律建议字段

| 字段名 | 中文名 | 类型 | 来源 | 说明 |
|---|---|---|---|---|
| advice | 法律建议 | object | 后端返回 | 当前前端 mock 模块名 |
| advice.recommendations | 建议清单 | array | 后端返回 | 按优先级展示 |
| advice.recommendations[].priority | 优先级 | enum | 后端返回 | 可选值：`P0`/`P1`/`P2` |
| advice.recommendations[].title | 建议标题 | string | 后端返回 | 简短动作标题 |
| advice.recommendations[].description | 建议描述 | string | 后端返回 | 具体处置说明 |
| advice.documentPreview | 文书预览 | string | 后端返回 | Markdown 格式 |
| advice.documentDownloadUrl | 文书下载链接 | string | 后端返回 | 生成后返回；当前前端 mock 暂未实现该字段，下载按钮为 disabled |

待法学 C 确认：`documentPreview` 的 Markdown 模板结构？需要哪些占位变量？是否需固定包含“风险结论/处置方案/证据保全/后续安排”四段？

## 10. 命名与类型约定

| 规则 | 建议 |
|---|---|
| 字段命名 | 统一使用 camelCase |
| 时间格式 | 列表与详情建议统一 `YYYY-MM-DD HH:mm`；如需跨时区，后端返回 ISO 8601 |
| 枚举值 | 前后端固定英文枚举，前端负责中文映射 |
| 图片字段 | 上传字段用 `File` 或 Base64；展示字段用 URL |
| 法理文本 | 建议区分摘要字段与全文字段，避免列表页直接传超长全文 |
| 字段差异 | 当前 mock 中 `hasRisk` 可读性较弱，建议接口层统一为 `hasAbsoluteRisk`/`hasRelativeRisk`，前端可做映射 |

## 11. 待确认项汇总

| 负责人 | 待确认项 |
|---|---|
| 法学 A | `conflicts` 是否来自 `trademark_db.json`；字段名是否一致；`registrationNo` 格式是否按 WIPO/NOIP 原始编号保留 |
| 法学 B | 越南法条编号体系是否覆盖《工业产权法》第72-76条；`articles` 是否需要增加法条全文、来源链接、生效日期 |
| 法学 C | `precedents` 判例来源与字段结构；是否需要判决书全文、来源链接、法域字段；`documentPreview` Markdown 模板结构与占位变量 |
| 后端 | 审查状态字段 `taskId/status/currentStep/progress` 的返回方式是轮询还是 SSE/WebSocket；报告字段是否按本文对象结构返回 |
| 前端 | 将提交页 `notes` 统一为 `additionalInfo`；决定 `hasRisk` 是否在接口映射层转换为 `hasAbsoluteRisk`/`hasRelativeRisk` |
| 全员 | `radarData` 的视觉维度是否固定为 5 项，还是允许后端动态扩展 |

