# deploy cmd

- docker run -itd -p 8090:80 --name k-api -e API_URL=http://172.16.7.25:8888/api/v1/vector_search knowledge_api:v4

# 打包命令

- docker build -t knowledge_api:v4 .
