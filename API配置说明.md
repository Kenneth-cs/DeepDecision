# API配置说明

## 快速配置步骤

### 1. 获取火山引擎API密钥
1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 注册/登录账号
3. 进入「豆包大模型」服务
4. 创建API密钥

### 2. 配置API密钥
打开 `api-prompt-config.js` 文件，找到以下行：
```javascript
"Authorization": "Bearer YOUR_API_KEY"
```

将 `YOUR_API_KEY` 替换为您的实际API密钥：
```javascript
"Authorization": "Bearer sk-your-actual-api-key-here"
```

### 3. 验证配置
保存文件后，刷新页面。如果配置正确，搜索功能将正常工作。

## 常见问题

### Q: 出现"API密钥未配置"错误
**A:** 请确保已正确替换API密钥，且密钥格式正确（以sk-开头）。

### Q: 出现"网络连接失败"错误
**A:** 可能原因：
- 网络连接问题
- 防火墙阻止请求
- API服务暂时不可用

### Q: 出现"API密钥验证失败"错误
**A:** 请检查：
- API密钥是否正确
- 账户是否有足够余额
- API密钥是否已激活

## 安全提醒

⚠️ **重要**：请勿将包含真实API密钥的文件提交到公共代码仓库！

建议做法：
1. 将 `api-prompt-config.js` 添加到 `.gitignore`
2. 创建 `api-prompt-config.example.js` 作为模板
3. 在生产环境中使用环境变量管理密钥

## 技术支持

如遇到其他问题，请：
1. 检查浏览器控制台错误信息
2. 确认网络连接正常
3. 联系技术支持团队