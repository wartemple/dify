# 合并最新流程
### 合并流程
```
- 先到github拉取最新的代码到自身项目
- 本地拉取最新代码 main 
- 切换到bob分支后 git merge main
- 解决合并冲突
```

### 问题 db migrate merge(新建的表【prompt Cases 未生效】)
```
如果 flask db upgrade error:
执行 flask db history
查看是否有多个head
合并多个head: flask db merge heads -m "merging three heads"
之后执行 flask db upgrade 
```

### 前端的默认语言修改为中文（登录界面一直有warning警告）
```
web/i18n/index.tx defaultLocale为zh-Hans
```

### 登录成功后，后端接口401
```
暂不清楚原因，清几次缓存重启服务试试
```
### 二开功能项记录

- 删除多余的logo图标（前端）
- 新增注册页面（前端）[后续会删除]
- 新增注册接口（后端），注册用户将自动注册大模型引擎
- 新增内部大模型模型提供商bob（chatglm2）
- 新增提示词实验室页面及其功能（前后端）
- 统一登录修改（前端默认跳转）（后端中间件自动注册用户）[未开发]


