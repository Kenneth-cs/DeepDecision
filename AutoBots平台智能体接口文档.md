AutoBots平台智能体接口文档

调用须知 平台所有方法调用需要智能体ID和token（token通过智能体发布详情->API发布，添加秘钥）（包括工作流、插件的调用，需要先建一个智能体然后绑定工作流）
受底层模型资源限制，大模型相关接口（智能体、工作流）目前很难保证高可用高并发。请确保在遇到AutoBots服务响应慢或超时的场景下能够自动降级。

一、JSF接口1、基本信息pom依赖：
<dependency>
  <groupId>com.jd.autobots</groupId>
  <artifactId>autobots-client</artifactId>
  <version>1.1.0</version>
</dependency>
jsf别名及隐式token传参：
线上环境：
    jsf别名：llm-manage，jsf接口隐式token：d0f64ac051d741aa8dff715791b31fea
接口名：
com.jd.llm.client.service.AutoBotsService
<jsf:consumer id="autoBotsService" interface="com.jd.llm.client.service.AutoBotsService" alias="${jsf.autobots.alias}" timeout="10000">
    <jsf:parameter key="token" value="${jsf.autobots.token}" hide="true"/>
</jsf:consumer>
2、智能体方法获取智能体基本信息：getAgentBaseInfo
根据agentId查询智能体基本信息：创建人、创建时间、欢迎语、默认推荐问题、提示词等配置
getAgentBaseInfo(String agentId, String token, AutoBotsRequest request);
入参：AutoBotsRequest
参数
类型
是否必填
名称
说明
traceId
String
是
会话ID
每次调用唯一标志,每次调用都需要传入不同的id，建议使用uuid
erp
String
是
用户erp
用户erp，必填
public void testGetAgentBaseInfo() {
    String agentId = "xxxxxxxxxxxx";//autobots平台获取智能体ID
    String token = "xxxxxxxxxxxxxxxxxxxxxxxx";//autobots平台获取智能体秘钥
    String erp = "bjwangjuntao";//用户erp
    AutoBotsRequest request = new AutoBotsRequest();
    request.setTraceId(UUID.randomUUID().toString());
    request.setErp(erp);
    BotsResponse<AgentBaseInfo> response = autoBotsService.getAgentBaseInfo(agentId, token, request);
    if (response.getCode() == 200) {
        log.info("获取智能体基本信息：" + JSONObject.toJSONString(response.getData()));
    }
}
{
  "code": 200,
  "data": {
      "agentName": "智能体名称",
      "agentDesc": "智能体描述",
      "introduce": "介绍文案欢迎语",
      "prompt": "prompt提示词",
      "relQuestions": [// 推荐问题
        "VPN如何申请？",
        "员工卡怎么办理？",
        "加班几点可以打车？"
      ]
    }
}

智能体问答请求：searchAiRequest（限流20 QPS）

发送智能问答请求，同一次会话traceId一致，reqId每次需要是新的
searchAiRequest(String agentId, String token, AutoBotsRequest request);
入参：AutoBotsRequest
参数
类型
是否必填
名称
示例
traceId
String
是
会话ID
会话id，同一个会话相同（仅限中英文-）
reqId
String
是
请求ID
每次问答请求，生成一个新请求
erp
String
是
用户erp
用户erp，必填
callbackUrl
String
否
回调url（流式回复使用）
智能体回答结果有两种获取方式：
1、轮询调用searchAiResult方法获取回答结果
2、如果传了callbackUrl入参，则回答的结果会通过回调url的方式主动发给调用方
keyword
String
是
查询关键字

commandCode
String
否
指令code

extParams
Map
否
扩展参数

    fileUrls
List<String>
否
上传文件url
如果基于文档做问答，传上传文档的url
    messages
List<Object>
否
历史对话
[{"role":"user","content":"用户问题"},{"role":"assistant","content":"机器人回答"}]
public void testSearchAiRequest() {
    String agentId = "";//autobots平台获取智能体ID
    String token = "";//autobots平台获取智能体秘钥
    String erp = "bjwangjuntao";//用户erp
    AutoBotsRequest request = new AutoBotsRequest();
    request.setTraceId(UUID.randomUUID().toString());//会话ID，同一个会话相同
    request.setReqId(String.valueOf(System.currentTimeMillis()));//请求ID，每次请求不一样
    request.setErp(erp);
    request.setKeyword("今天天气怎么样？");//用户查询关键字
    BotsResponse<AutoBotsResult> response = autoBotsService.searchAiRequest(agentId, token, request);
    if (response.getCode() == 200) {
        String status = response.getData().getStatus();
        //异步执行，轮询获取结果
        if ("loading".equals(status)) {
            //searchAiResult获取结果方法需要跟searchAiRequest请求方法入参保持一致（根据erp+traceId+reqId确定一次完整的问答）
            response = autoBotsService.searchAiResult(agentId, token, request);
            log.info("智能问答获取结果：" + JSONObject.toJSONString(response));
            status = response.getData().getStatus();
            // status为running，表示持续输出，为finished表示结束输出（或者判断finished=true）
            while ("running".equals(status)) {
                response = autoBotsService.searchAiResult(agentId, token, request);
                log.info("智能问答获取结果：" + JSONObject.toJSONString(response));
                status = response.getData().getStatus();
                // 休眠一段时间，否则调用量太多会触发限流
		Thread.sleep(1000);
            }
        } else if ("no".equals(status)) {//大模型无法回复
            log.info("大模型无法回复，自己写兜底文案");
        }
    }
}
{
  "code": 200,
  "data": {
    "finished": false,//是否结束
    "response": "",//增量回复内容
    "responseAll": "",//全量回复内容
    "responseType": "markdown",//结果类型
    "status": "running",//状态：loading（流式回复）、running（流式回复中）、finished（执行完成）、no（大模型无法回答）
    "traceId": "8079b4e3-c5e1-43d9-9e1d-54cbd4793e73",
    "useTimes": 11844,//回复耗时
    "useTokens": 0,//消耗token
    "relDoc":[//关联文档
        {
          "name": "JOYSPACE",
          "url": "https://joyspace.jd.com/page/lQ4skgxUjGiijLEGpRwI",
          "pageName": "员工服务大厅搜索restful服务",
          "refId": "920-lQ4skgxUjGiijLEGpRwI",
          "deepLink": null,
          "type": "JOYSPACE"
        }
    ]
  }
}
智能体问答查询结果（流式回复）：searchAiResult
需要先调用searchAiRequest触发问答请求，再用相同的请求参数调用searchAiResult获取结果
获取智能问答结果，通过erp+traceId+reqId与问答请求对应
searchAiResult(String agentId, String token, AutoBotsRequest request);
调用示例：同上

智能体会话推荐：suggestionQuery
每次问答，会根据用户的query推荐三个相似问题
suggestionQuery(String agentId, String token, AutoBotsRequest request);
public void testSuggestionQuery() {
    String agentId = "";//autobots平台获取智能体ID
    String token = "";//autobots平台获取智能体秘钥
    String erp = "bjwangjuntao";//用户erp
    AutoBotsRequest request = new AutoBotsRequest();
    request.setTraceId(UUID.randomUUID().toString());//会话ID，同一个会话相同
    request.setReqId(String.valueOf(System.currentTimeMillis()));//请求ID，每次请求不一样
    request.setErp(erp);
    request.setKeyword("今天天气怎么样？");
    BotsResponse<List<String>> response = autoBotsService.suggestionQuery(agentId, token, request);
    if (response.getCode() == 200) {
        log.info("推荐的问题：" + JSONObject.toJSONString(response.getData()));
    }
}
执行工作流：runWorkflow（限流20 QPS）
注意：工作流并发限制500（同时执行的工作流任务数，如果工作流执行过慢，请优化工作流）

runWorkflow(String agentId, String token, AutoBotsWfRequest request);
入参：AutoBotsWfRequest
参数
类型
是否必填
名称
说明
traceId
String
是
会话ID
每次工作流调用唯一标志，不可重复
建议用UUID
erp
String
是
用户erp
用户erp，必填
extParams
Map<String,Object>
是
扩展参数
工作流入参放入此map中
callbackUrl
String
否
回调url，POST请求
url不为空时，工作流运行结束会调用此url回传工作流运行结果。（http body为工作流运行结果）
workflowId
String
是
工作流ID
执行工作流时传工作流ID

public void testRunWorkflow() throws Exception {
    Long FLOW_TIME_OUT = 5 * 60 * 1000L;
    String agentId = "";//autobots平台获取智能体ID
    String token = "";//autobots平台获取智能体秘钥
    String erp = "bjwangjuntao";//用户erp
    AutoBotsWfRequest request = new AutoBotsWfRequest();
    request.setTraceId(UUID.randomUUID().toString());//通过相同的traceId拿结果
    request.setErp(erp);
    //执行的工作流ID，如果不传默认用智能体绑定的工作流
    request.setWorkflowId("1216");
    //如果传了callbackUrl，则工作流执行完毕后会向该url发送结果（post请求，body传参）
    request.setCallbackUrl("");
    //工作流入参，具体入参看在平台中配置的工作流
    Map<String, Object> workflowParams = new HashMap<>();
    workflowParams.put("interview", "京东");
    workflowParams.put("method", "");
    request.setExtParams(workflowParams);
    BotsResponse<AutoBotsResult> response = autoBotsService.runWorkflow(agentId, token, request);
    if (response.getCode() == 200) {
        long startTime = System.currentTimeMillis();
        response = autoBotsService.getWorkflowResult(agentId, token, request);
        // 判断没有结束，及超时（最好设置个超时，防止异常情况）
        while (response.getCode() == 200 && !response.getData().isFinished() && System.currentTimeMillis() - startTime < FLOW_TIME_OUT) {
            // 休眠一段时间，否则调用量太多会触发限流
            ThreadUtil.sleep(1000);
            response = autoBotsService.getWorkflowResult(agentId, token, request);
        }
        log.info("工作流结果：" + JSONObject.toJSONString(response.getData().getResultMap()));
    }
}
工作流获取结果(异步执行)：getWorkflowResult
入参：AutoBotsWfRequest
参数
类型
是否必填
名称
说明
traceId
String
是
会话ID
需要runWorkflow的保持一致，才能获取到结果
erp
String
是
用户erp
用户erp，必填
workflowId
String
是
工作流ID
执行的工作流ID
getWorkflowResult(String agentId, String token, AutoBotsRequest request)
通过回调方式获取结果示例：
@RequestMapping(value = "/callbackResult", method = { RequestMethod.POST })
public R<String> callbackResult(@RequestBody AutoBotsResult result) {
   log.info("工作流结果：{}", JSONObject.toJSONString(result));
   return R.success();
}
工作流出参：AutoBotsResult
参数
类型
名称
说明
status
String
执行状态
running：执行中、finished：完成、error：失败
finished
Boolean
是否结束

resultMap
Map<String,Object>
工作流结果

智能体问答反馈：feedback
BotsResponse<String> feedback(FeedbackRequest request)
输入参数：
{
  "traceId": "xxxxxxx",  // 会话ID，需要跟请求保持一致
  "reqId": "xxxxxx",  // 请求ID，需要跟请求保持一致
  "up": 1,  //是否点赞，1是，0否
  "down": 1, //是否点踩，1是，0否
  "downReason": "不好用"  //点踩原因
}
二、HTTP接口1、基本信息    线上环境域名：http://autobots-bk.jd.local
接口均为post请求
请求头：
名称
类型
描述

Content-Type
String
application/json; charset=utf-8

autobots-agent-id
String
智能体ID

autobots-token
String
智能体token

Accept
String
*/*
一般都不需要加，遇到重定向错误的时候尝试加上这个header
入参request通过body形式传参，入参与jsf方法一致（详见上面）
2、智能体方法获取智能体基本信息：/autobots/api/v1/getAgentBaseInfo
智能体问答请求：/autobots/api/v1/searchAiRequest
智能体问答查询结果（流式回复）：/autobots/api/v1/searchAiResult
智能体问答（SSE长连接方式）：/autobots/api/v1/searchAiSse
@Test
public void testSse() throws Exception {
	HttpRequestBase httpReq = new HttpPost("http://autobots-bk.jd.local/autobots/api/v1/searchAiSse");
	RequestConfig requestConfig = RequestConfig.custom().setConnectTimeout(60000).setConnectionRequestTimeout(60000).setSocketTimeout(60000).build();
	httpReq.setConfig(requestConfig);
	//传入header信息
	httpReq.setHeader("autobots-agent-id", "xxxx");
	httpReq.setHeader("autobots-token", "xxxxxx");
	//传入body信息
	JSONObject body = new JSONObject();
	body.put("traceId", UUID.randomUUID().toString());
	body.put("reqId", String.valueOf(System.currentTimeMillis()));
	body.put("erp", "bjwangjuntao");
	body.put("keyword", "怎么申请vpn权限");
	((HttpEntityEnclosingRequestBase) httpReq).setEntity(new StringEntity(body.toJSONString(), ContentType.create("application/json", "utf-8")));
	CloseableHttpResponse response = HttpClient.INS.getHttpClient().execute(httpReq);
	log.info("sse形式接口返回......statusCode：" + response.getStatusLine().getStatusCode());
	BufferedReader reader = new BufferedReader(new InputStreamReader(response.getEntity().getContent()));
	String line;
	while ((line = reader.readLine()) != null) {
		if (StringUtils.isNotEmpty(line)) {
			log.info(line);
		}
	}
}
智能体会话推荐：/autobots/api/v1/suggestionQuery
执行工作流：/autobots/api/v1/runWorkflow
@Test
public void testRunWorkflowHttp() {
    Long FLOW_TIME_OUT = 5 * 60 * 1000L;
    Map<String, String> header = new HashMap<>();
    header.put("autobots-agent-id", "");
    header.put("autobots-token", "");
    JSONObject body = new JSONObject();
    body.put("traceId", UUID.randomUUID().toString());
    body.put("erp", "bjwangjuntao");
    body.put("workflowId", "203");
    //工作流入参，具体入参看在平台中配置的工作流
    Map<String, Object> workflowParams = new HashMap<>();
    workflowParams.put("interview", "京东");
    workflowParams.put("method", "");
    body.put("extParams", workflowParams);
    String bodyStr = body.toJSONString();
    String responseStr = HttpUtils.postReq("http://autobots-bk.jd.local/autobots/api/v1/runWorkflow", header, bodyStr);
    BotsResponse<AutoBotsResult> response = JSONObject.parseObject(responseStr, new TypeReference<BotsResponse<AutoBotsResult>>() {
    });
    if (response.getCode() == 200) {
        long startTime = System.currentTimeMillis();
        responseStr = HttpUtils.postReq("http://autobots-bk.jd.local/autobots/api/v1/getWorkflowResult", header, bodyStr);
        response = JSONObject.parseObject(responseStr, new TypeReference<BotsResponse<AutoBotsResult>>() {
        });
        // 判断没有结束，及超时（最好设置个超时，防止异常情况）
        while (response.getCode() == 200 && !response.getData().isFinished() && System.currentTimeMillis() - startTime < FLOW_TIME_OUT) {
            // 休眠一段时间，否则调用量太多会触发限流
            ThreadUtil.sleep(200);
            responseStr = HttpUtils.postReq("http://autobots-bk.jd.local/autobots/api/v1/getWorkflowResult", header, bodyStr);
            response = JSONObject.parseObject(responseStr, new TypeReference<BotsResponse<AutoBotsResult>>() {
            });
        }
        log.info("工作流结果：" + JSONObject.toJSONString(response.getData().getResultMap()));
    }
}
工作流获取结果(异步执行)：/autobots/api/v1/getWorkflowResult
    入参traceId、erp、workflowId为必填，并且必须跟runWorkflow一致