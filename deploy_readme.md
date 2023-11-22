# 打包后端镜像

```
cd api
docker build -t llm-api:0.3.30-$(date "+%Y%m%d-%H%M%S") .
后端配置环境变量：
BOBFINTECH_LLM_URL=https://ai.bobfintech.com.cn/llm-api/api/v1/chat/completions
BOBFINTECH_EMBEDDING_URL=https://ai.bobfintech.com.cn/emb-api/api/v1/text2vec/base-chinese
```

# 打包前端镜像

```
cd web
docker build -t llm-web:0.3.30-$(date "+%Y%m%d-%H%M%S") .
```

## 0.3.21版本之前需要执行

flask update_app_model_configs --batch-size=500

psql -U postgres  -d dify
