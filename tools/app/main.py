from sanic import Sanic, Request
from sanic.response import text, json
from sanic_ext import Extend
from dataclasses import dataclass
from processors.base_processor import BaseProcessor
import importlib
from pydantic import BaseModel

app = Sanic("APP")
app.update_config("./config.py")
ext = Extend(app)


class InputData(BaseModel):
    point: str
    params: dict = {}


@dataclass
class ProcessMap:
    raw_path: str
    redirected_url: str
    headers: dict
    tool_processor: BaseProcessor

    @classmethod
    async def create(cls, request: Request, tool_path: str):
        processor = app.config.TOOL_PATH2PROCESSOR[tool_path]
        module_name, _, class_name = processor['tool_processor'].rpartition('.')
        module = importlib.import_module(module_name)
        class_obj = getattr(module, class_name)
        return cls(raw_path=tool_path,
                   redirected_url=processor['redirected_url'],
                   headers=processor['headers'],
                   tool_processor=class_obj)


ext.injection(ProcessMap, ProcessMap.create)


@app.post("/<tool_path:str>")
async def search(request: Request, tool_path: str, process_map: ProcessMap):
    data = InputData(**request.json)
    point = data.point
    # for debug
    print(f"point: {point}")
    if point == "ping":
        return json({"result": "pong"})
    if point == "app.external_data_tool.query":
        query = data.params.get("query", '')
        inputs = data.params.get("inputs", '')
        print(f"data: {data}")
        if not query:
            raise ValueError("not exists query error")
        print(process_map)
        instance = process_map.tool_processor(
            api_url=process_map.redirected_url, headers=process_map.headers)
        result = instance.search(query, inputs)
        return json({"result": result})
    return text(f"point error: {point}")
