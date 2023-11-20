from typing import List, Optional, Any

from langchain.callbacks.manager import Callbacks
from langchain.schema import LLMResult

from core.model_providers.error import LLMBadRequestError
from core.model_providers.models.llm.base import BaseLLM
from core.model_providers.models.entity.message import PromptMessage
from core.model_providers.models.entity.model_params import ModelMode, ModelKwargs
from core.third_party.langchain.llms.bob_fintech_ai import BOBFinTechChatLLM


class BOBFinTechAIModel(BaseLLM):
    model_mode: ModelMode = ModelMode.COMPLETION
    name2model = {
        "bobfintechai": "chatglm2",
        "bobfintechai-v2": "baichuan",
    }
    name2base_url = {
        "bobfintechai": "BOBFINTECH_LLM_URL",
        # "bobfintechai-v2": "baichuan",
    }

    def _init_client(self) -> Any:
        provider_model_kwargs = self._to_model_kwargs_input(self.model_rules, self.model_kwargs)
        return BOBFinTechChatLLM(
            model=self.name2model.get(self.name, "chatglm2"),
            streaming=self.streaming,
            callbacks=self.callbacks,
            **self.credentials,
            **provider_model_kwargs
        )

    def _run(self, messages: List[PromptMessage],
             stop: Optional[List[str]] = None,
             callbacks: Callbacks = None,
             **kwargs) -> LLMResult:
        """
        run predict by prompt messages and stop words.

        :param messages:
        :param stop:
        :param callbacks:
        :return:
        """
        import os
        url_key = self.name2base_url.get(self.name)
        # os.environ[url_key] = 'https://ai.bobfintech.com.cn/llm-api/api/v1/chat/completions'
        if url_key and os.getenv(url_key):
            return self._client.generate([messages], stop, callbacks, base_url=os.getenv(url_key))
        return self._client.generate([messages], stop, callbacks, )

    def get_num_tokens(self, messages: List[PromptMessage]) -> int:
        """
        get num tokens of prompt messages.

        :param messages:
        :return:
        """
        # prompts = self._get_prompt_from_messages(messages)
        return max(self._client.get_num_tokens_from_messages(messages), 0)

    def _set_model_kwargs(self, model_kwargs: ModelKwargs):
        provider_model_kwargs = self._to_model_kwargs_input(self.model_rules, model_kwargs)
        for k, v in provider_model_kwargs.items():
            if hasattr(self.client, k):
                setattr(self.client, k, v)

    def handle_exceptions(self, ex: Exception) -> Exception:
        return LLMBadRequestError(f"BOB FinTech AI: {str(ex)}")

    @property
    def support_streaming(self):
        return True
