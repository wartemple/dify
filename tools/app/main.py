from fastapi import FastAPI, Body, HTTPException, Header
from pydantic import BaseModel
import httpx
import os
from pprint import pprint

app = FastAPI()


class InputData(BaseModel):
    point: str
    params: dict = {}


@app.post("/api/knowledge_server")
async def dify_receive(data: InputData = Body(...), authorization: str = Header(None)):
    expected_api_key = os.getenv("API_KEY", "bobfintechai")
    auth_scheme, _, api_key = authorization.partition(' ')

    if auth_scheme.lower() != "bearer" or api_key != expected_api_key:
        raise HTTPException(status_code=401, detail="Unauthorized")

    point = data.point

    # for debug
    print(f"point: {point}")

    if point == "ping":
        return {
            "result": "pong"
        }
    if point == "app.external_data_tool.query":
        return handle_app_external_data_tool_query(params=data.params)
    # elif point == "{point name}":
        # TODO other point implementation here

    raise HTTPException(status_code=400, detail="Not implemented")


def handle_app_external_data_tool_query(params: dict):
    app_id = params.get("app_id")
    tool_variable = params.get("tool_variable")
    inputs = params.get("inputs")
    query = params.get("query")

    # for debug
    pprint(params)

    api_url = os.getenv("API_URL")
    if api_url:
        res = httpx.post(api_url, json={
            "query": query,
            "user_id": "",
            "threshold": 0.35
        })
        pprint(res.json())
        results = ""
        for item in res.json()["data"]["recalls"]:
            results += item['content']
        return {"result": results}

    return {
        "result": "City: London\nTemperature: 12°C\nRealFeel®: 8°C\nAir Quality: Poor\nWind Direction: ENE\nWind "
                    "Speed: 8 km/h\nWind Gusts: 14 km/h\nPrecipitation: Light rain"
    }