from .base_processor import BaseProcessor
import httpx


class AIProcessor(BaseProcessor):
    def search(self, query: str, inputs: dict) -> str:
        res = httpx.post(self.api_url, json={"query": query}, timeout=15)
        return self.extract_results(res)
    
    def extract_results(self, response):
        return response.json()