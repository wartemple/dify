# 如何去新建一个模型提供商
# 新建用户初始化
api/controllers/console/auth/login.py
28 line: 新增初始化引擎

# 新建模型工厂分支
api/core/model_providers/model_provider_factory.py
29 line: 新增分支

# 新建模型提供商
api/core/model_providers/providers
在此路径下新增例如： baichuan_provider.py
可复用chatglm_provider.py

# 初始化json进行新增
更新： api/core/model_providers/rules/_providers.json
新建：api/core/model_providers/rules/baichuan.json （复制chatglm.json即可）

# 有必要时需新增model(就用langchain的chatglm就行)再说