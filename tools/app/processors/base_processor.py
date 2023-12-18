from abc import ABC, abstractmethod


class BaseProcessor(ABC):
    
    def __init__(self, api_url, headers) -> None:
        self.api_url = api_url
        self.headers = headers
        
    @abstractmethod
    def search(self, query: str, inputs: dict) -> str:
        raise NotImplementedError
