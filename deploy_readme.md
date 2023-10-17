# 打包后端镜像
```
cd api
docker build -t llm-api:0.3.26-$(date "+%Y%m%d-%H%M%S") .
```
# 打包前端镜像
```
cd web
docker build -t llm-web:0.3.26-$(date "+%Y%m%d-%H%M%S") .
```