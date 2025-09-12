DeepDecision——基于场景化AI决策的医疗循证平台

一句话简介：（150字以内）
首创"临床场景自适应搜索召回引擎"，通过实时场景分类（准确率92%）动态融合多模态医疗证据（文献/指南/病例/图像），实现诊疗全流程精准决策支持，为临床提供安全可靠的AI"第二诊疗意见"。

项目亮点
核心痛点：（300字以内）
解决了哪些业务/用户的技术难题或业务难题
跨专科决策盲区：单一疾病需多科室证据（如"糖尿病足"需内分泌、血管外科、烧伤科知识），传统工具无法动态融合，导致决策片面，传统检索无法动态融合跨专科知识
搜索引擎场景单一：通用搜索引擎无法识别临床场景差异（如治疗方案需循证等级优先，患者教育需通俗化），导致关键证据遗漏
信息过载与漏召：医疗知识分散于文献/指南/病例等多源异构数据，95%医生遭遇信息轰炸，平均需筛查42篇文献才能做出决策
安全危机：药品禁忌症等高风险信息漏召可能直接引发医疗事故

关键创新点：（300字以内）
较行业现有方案的差异及创新
场景智能路由引擎：
基于临床意图解析（11类场景自适应），动态调整召回策略与排序权重
创新点：治疗场景自动并联药品说明书+文献+指南三重证据链
全科循证知识网：
构建跨模态关联体系：药品说明书↔最新文献↔病例库图像↔基层诊疗规范
创新点：基层场景自动降维专业术语（"糖化血红蛋白"→ "血糖三个月平均值"）
医疗安全双保险：
高危药品强制时效熔断（>10年文献降权）+ 医生众包拦截闭环（3次标注触发人工复核）
创新点：全国首套医疗搜索安全熔断标准

## 技术架构设计

### 核心技术栈
- **AI引擎**: 京东AutoBots平台智能体
- **后端架构**: Spring Boot + JSF服务调用
- **前端框架**: React/Vue.js + TypeScript
- **数据存储**: MySQL + Redis + ElasticSearch
- **消息队列**: RocketMQ
- **监控体系**: 京东云监控 + 自研安全熔断

### AutoBots API集成方案

#### 1. 智能体配置
- **智能体ID**: 医疗循证专用智能体
- **Token认证**: 通过智能体发布详情->API发布获取秘钥
- **限流策略**: 智能问答20 QPS，工作流20 QPS，并发限制500
- **降级机制**: AutoBots服务响应慢或超时时自动降级到传统搜索

#### 2. 接口集成架构

#### 3. 鉴权机制
- **JSF调用**: 使用隐式token传参（d0f64ac051d741aa8dff715791b31fea）
- **HTTP调用**: Header传递autobots-agent-id和autobots-token
- **会话管理**: traceId标识会话，reqId标识单次请求

## API接口设计

### 1. 智能问答接口

#### 请求参数
```json
{
  "traceId": "uuid",           // 会话ID，同一会话保持一致
  "reqId": "timestamp",       // 请求ID，每次请求唯一
  "erp": "doctor_id",         // 医生ID
  "keyword": "临床问题",       // 用户查询关键字
  "commandCode": "MEDICAL",   // 医疗场景指令码
  "extParams": {
    "specialty": "内科",       // 专科领域
    "patientAge": 45,         // 患者年龄
    "urgencyLevel": "high"     // 紧急程度
  },
  "fileUrls": ["检查报告URL"],  // 上传的医疗文档
  "messages": [               // 历史对话记录
    {"role": "user", "content": "用户问题"},
    {"role": "assistant", "content": "AI回答"}
  ]
}
```

#### 响应格式
```json
{
  "code": 200,
  "data": {
    "finished": false,
    "response": "增量回复内容",
    "responseAll": "全量回复内容",
    "responseType": "markdown",
    "status": "running",      // loading/running/finished/no
    "traceId": "会话ID",
    "useTimes": 11844,        // 回复耗时(ms)
    "useTokens": 256,         // 消耗token数
    "relDoc": [               // 关联医疗文档
      {
        "name": "临床指南",
        "url": "文档链接",
        "pageName": "指南名称",
        "refId": "引用ID",
        "type": "GUIDELINE",
        "evidenceLevel": "A"    // 证据等级
      }
    ],
    "safetyWarnings": [       // 安全警告
      {
        "type": "DRUG_INTERACTION",
        "message": "药物相互作用警告",
        "severity": "high"
      }
    ]
  }
}
```

### 2. 证据检索工作流接口

#### 工作流参数
```json
{
  "traceId": "uuid",
  "erp": "doctor_id",
  "workflowId": "evidence_search_workflow",
  "extParams": {
    "query": "糖尿病足治疗方案",
    "specialty": ["内分泌科", "血管外科"],
    "evidenceTypes": ["guideline", "literature", "case"],
    "timeRange": "5years",
    "languagePreference": "zh-CN"
  }
}
```

#### 工作流结果
```json
{
  "status": "finished",
  "finished": true,
  "resultMap": {
    "evidenceList": [
      {
        "title": "证据标题",
        "summary": "证据摘要",
        "source": "来源期刊",
        "publishDate": "2023-01-01",
        "evidenceLevel": "A",
        "specialty": "内分泌科",
        "doi": "10.1000/xxx",
        "relevanceScore": 0.95
      }
    ],
    "crossSpecialtyLinks": [
      {
        "fromSpecialty": "内分泌科",
        "toSpecialty": "血管外科",
        "linkType": "treatment_coordination",
        "evidence": "协作治疗证据"
      }
    ],
    "safetyAlerts": [
      {
        "alertType": "CONTRAINDICATION",
        "description": "禁忌症提醒",
        "affectedDrugs": ["药物A", "药物B"]
      }
    ]
  }
}
```

### 3. 安全监控接口

#### 反馈接口
```json
{
  "traceId": "会话ID",
  "reqId": "请求ID",
  "up": 1,                    // 点赞
  "down": 0,                  // 点踩
  "downReason": "不准确",      // 点踩原因
  "safetyReport": {           // 安全问题报告
    "issueType": "WRONG_DOSAGE",
    "description": "剂量错误",
    "severity": "high"
  }
}
```

页面设计：

首页/搜索页

顶部搜索框（自然语言输入，类似氢离子风格的简洁输入框）
- 集成AutoBots智能提示，支持医疗术语自动补全
- 场景识别标签（诊断/治疗/用药/教育）

推荐场景入口（临床问题、用药参考、诊断路径）
- 基于AutoBots智能体推荐的常见临床场景
- 动态更新热门查询和专科推荐

历史搜索记录（以卡片形式简约展示）
- 支持会话恢复（基于traceId）
- 智能分类历史查询

搜索结果页

左侧为筛选条件（专业领域、时间、证据等级）
- 集成AutoBots的多维度筛选能力
- 实时更新筛选结果统计

主区域为卡片式结果（每个结果包含：结论摘要、来源期刊/时间、证据等级标签）
- 流式显示AutoBots返回的增量结果
- 安全警告优先展示
- 跨专科关联证据可视化

支持快速切换「摘要 / 详细 / 可视化」三种展示模式
- 摘要模式：AutoBots生成的核心结论
- 详细模式：完整的证据链和推理过程
- 可视化模式：证据关系图和决策树

证据详情页

顶部展示结论摘要 + 核心图表（柱状图/流程图/表格）
- AutoBots生成的结构化摘要
- 动态生成的证据强度可视化

下方展示证据链（引用文献卡片 + DOI 链接）
- 基于AutoBots relDoc的关联文档展示
- 证据等级和时效性标注

底部操作栏：收藏、分享、生成患者材料
- 集成反馈接口，支持点赞/点踩
- 安全问题一键报告

个人中心 / 工作流工具

我的收藏、历史查询
- 基于traceId的会话管理
- 个性化推荐基于AutoBots学习

常用诊疗路径模板
- AutoBots工作流驱动的标准化路径
- 支持自定义工作流配置

设置（专业偏好、通知、主题切换）
- AutoBots智能体个性化配置
- API调用频率和降级策略设置

## 数据流程设计

### 用户查询处理流程
1. **场景识别**: 基于AutoBots智能体分析用户意图
2. **多源检索**: 并行调用文献库、指南库、病例库
3. **智能融合**: AutoBots工作流整合跨专科证据
4. **安全校验**: 自动检测药物禁忌、剂量风险
5. **结果排序**: 基于证据等级和相关性智能排序
6. **流式返回**: 实时展示AutoBots生成的增量结果

### 安全监控机制
1. **实时监控**: 监控AutoBots API调用状态和响应时间
2. **异常降级**: API超时或错误时自动切换到传统搜索
3. **质量反馈**: 收集用户反馈，持续优化智能体性能
4. **安全拦截**: 基于医疗安全规则的三重校验机制

## 技术实现要点

### 性能优化
- **缓存策略**: Redis缓存AutoBots常见查询结果
- **异步处理**: 使用RocketMQ处理耗时的工作流任务
- **连接池**: 优化AutoBots API连接复用
- **限流保护**: 客户端限流避免触发AutoBots平台限制

### 安全保障
- **Token管理**: 安全存储和轮换AutoBots访问令牌
- **数据脱敏**: 患者隐私信息脱敏后传递给AutoBots
- **审计日志**: 完整记录所有AutoBots API调用和响应
- **权限控制**: 基于医生资质的分级访问控制

### 扩展性设计
- **微服务架构**: 独立的AutoBots集成服务
- **配置中心**: 动态调整AutoBots调用参数
- **多智能体支持**: 支持接入多个专科智能体
- **插件机制**: 支持自定义AutoBots工作流插件

通过集成京东AutoBots平台的智能体能力，DeepDecision将具备强大的自然语言理解、多轮对话、工作流编排和知识推理能力，为医疗循证决策提供更智能、更安全、更精准的AI支持。