// 创建配置文件
const CONFIG = {
    VOLCANO_API: {
        URL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        // 在生产环境中，应该从环境变量或安全存储中获取
        API_KEY: process.env.VOLCANO_API_KEY || 'e293d095-de9e-45e1-8e12-f35970ca4c14',

        MODEL: 'deepseek-v3-1-250821'
    }
};