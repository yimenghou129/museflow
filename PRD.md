# PRD — MuseFlow

## 版本：MVP 1.0
## 类型：完整产品需求文档（Comprehensive）

---

# 1. 产品概述

MuseFlow 是一个协作式执行系统，帮助用户将混乱的大脑输入转化为结构化、基于真实容量的可执行计划，并在执行崩盘时自动重组系统，带用户重新启动。

它不是待办清单。
它不是笔记工具。

MuseFlow 是一个执行引擎。

---

# 2. MuseFlow 解决的核心问题（三句话）

1. 把混乱的大脑输入，转化为清晰、可执行的结构。
2. 基于真实时间容量排出「做得完」的计划，而不是理想化清单。
3. 当执行崩盘时，自动重排并带用户重新启动。

---

# 3. 目标用户

**核心用户：**

- 自由职业者
- 独立创作者
- 自驱型学习者
- 无外部结构但有明确目标的人

**用户特征：**

- 脑内任务过载
- 严重高估每日容量
- 执行连续性差
- 对视觉体验敏感
- 希望被引导，但不喜欢被强制安排

---

# 4. 产品核心理念

1. 人机协作式规划（系统给建议，用户确认）
2. 容量感优先（Capacity-aware）
3. 渐进式自动化（基于偏好记忆）
4. 视觉化手账增强情感粘性
5. 以完成目标为核心，而不是记录任务

---

# 5. 核心用户流程（MVP）

1. **Brain Dump**：用户输入混乱、无结构的待办内容  
2. **结构化草案生成**：AI 将原始输入转为结构化建议  
3. **协作编辑**：用户修改分类、时长、优先级等  
4. **排期建议生成**：系统生成基于容量的周计划建议  
5. **用户确认**：用户调整并确认排期  
6. **每日执行**：Today 页面展示今日 Top 3  
7. **周总结生成**：系统生成视觉化 + 叙事总结  

---

# 6. 功能需求

## 6.1 Brain Dump 模块

**输入：**

- 支持多行自由文本  
- 无需结构  

**输出（通过 AI）：**  
生成结构化 JSON，包括：

- 分类建议（`category_suggestion`）
- 类型建议（`task` / `project` / `goal`）
- 子任务拆分（`sub_tasks`）
- 预计时长（`estimated_duration_minutes`）
- 紧急程度（`urgency_level`）
- 重要程度（`importance_level`）
- 能量类型（`energy_type: deep/light`）
- 建议时间窗口（`suggested_time_window`）
- 理由说明（`rationale`）

**必须：**

- 保存原始文本
- 保存解析结果
- 支持重新生成草案

---

## 6.2 Draft Editor 协作编辑模块

用户可修改：

- 分类
- 标题
- 预计时长
- 截止日期
- 优先级
- 能量类型
- 是否硬约束
- 拆分 / 合并任务
- 标记为 MUST（最低完成标准）

系统必须记录：

- 用户修改行为（用于偏好学习）

---

## 6.3 偏好记忆系统（基础版）

需记录：

- `daily_capacity_hours`（每日可用时间）
- `max_deep_tasks_per_day`（每日最大深度任务数）
- `preferred_work_window`（偏好时段）
- `task_type_duration_multiplier`（任务类型时长修正系数）
- `reminder_style`（提醒风格）
- 拖拽排期行为模式

**要求：**

- 偏好可查看
- 可编辑
- 可解释（不能黑箱）

---

## 6.4 排期引擎（容量感排期）

**输入：**

- 结构化任务
- 用户偏好
- 硬约束事件
- 能量类型
- 每日容量

**约束：**

- 不超过每日容量
- 限制深度任务数量
- 尊重硬约束
- 均衡分布负载

**输出：**

- 本周计划
- 今日 Top 3

**必须：**

- 给出排期理由
- 支持拖拽调整
- 修改后自动重算

---

## 6.5 动态重排系统

**触发：**

- 延期
- 超时
- 用户点击「我卡住了」

**系统行为：**

- 推迟依赖项
- 重新计算完成概率
- 提供三档方案：
  - MUST — 最低交付
  - GOOD — 正常
  - GREAT — 进阶

---

## 6.6 崩盘模式（Crisis Mode）

**触发条件：**

- 连续 2 天未完成 Top 3

**行为：**

- 只保留 1 个 15–30 分钟任务
- 移除非核心事项
- 提供最小启动动作

---

## 6.7 Today 页面

展示：

- 今日 Top 3
- 剩余容量
- 能量负载

快捷操作：

- 完成
- 延期
- 我卡住了

---

## 6.8 视觉化手账（MVP 必须）

每日自动生成：

- 时间轴（Timeline）
- 时间条（Time Bar）
- 时间饼图（按类别）
- 完成任务清单
- 简短叙事总结

尽量减少用户手动输入。

---

## 6.9 周总结（MVP 必须）

结构：

1. 时间分布饼图
2. 完成率统计
3. 本周成果
4. 卡点分析
5. 行为洞察
6. 下周主题建议

**必须：**

- 视觉化展示
- Persona 风格输出

---

## 6.10 Persona 模组（MVP 两种）

1. Gentle（温柔知性）
2. Executive（霸总秘书）

差异：

- 语气
- 提醒风格
- 强制程度

---

# 7. 数据模型

## UserPreference

- `id`
- `user_id`
- `daily_capacity_hours`
- `max_deep_tasks_per_day`
- `preferred_work_window`
- `task_type_duration_multipliers`
- `reminder_style`
- `created_at`
- `updated_at`

## BrainDump

- `id`
- `user_id`
- `raw_text`
- `created_at`

## DraftPlan

- `id`
- `user_id`
- `brain_dump_id`
- `structured_json`
- `status`
- `created_at`

## Task

- `id`
- `user_id`
- `draft_plan_id`
- `title`
- `category`
- `task_type`
- `energy_type`
- `estimated_duration_minutes`
- `actual_duration_minutes`
- `due_date`
- `hard_commitment`
- `priority`
- `status`
- `dependency_ids`
- `created_at`

## ScheduleBlock

- `id`
- `user_id`
- `date`
- `task_id`
- `duration_minutes`
- `block_type`
- `status`
- `created_at`

## Report

- `id`
- `user_id`
- `type`
- `period_start`
- `period_end`
- `metrics_json`
- `narrative_text`
- `created_at`

---

# 8. AI 使用规范

AI 用于：

- Brain Dump 结构化
- 周总结叙事生成
- 行为洞察生成

**规则：**

- 必须严格返回 JSON
- 必须校验 JSON
- 不得保存未定义字段
- 解析失败必须 fallback

---

# 9. 非目标（MVP 不做）

- 多人协作
- 日历同步
- 移动端原生 App
- 高级预测模型
- 社交系统
- 自由笔记系统

---

# 10. 技术栈建议

前端：

- Next.js（App Router）
- TailwindCSS

后端：

- Supabase（Auth + Postgres + RLS）

AI：

- OpenAI API

部署：

- Vercel

---

# 11. MVP Sprint 规划

**Sprint 1：**

- Brain Dump
- AI 结构化
- Draft Editor
- 基础排期（按天）
- Today 页面

**Sprint 2：**

- 动态重排
- 周总结
- Persona 模组
- 视觉化手账

**Sprint 3：**

- 崩盘模式
- 时长校准
- 月总结
- 偏好自动学习优化

---

# 12. 北极星指标

**Weekly Visible Output Rate**  
每周至少完成 1 个重要成果。

**辅助指标：**

- Draft 转化率
- Top 3 完成率
- 7 日留存
- 周报查看率

---

# 13. 产品定位总结

MuseFlow 不是记录工具。

MuseFlow 是一个：

把混乱转为结构，把结构转为计划，把计划转为完成的执行系统。

