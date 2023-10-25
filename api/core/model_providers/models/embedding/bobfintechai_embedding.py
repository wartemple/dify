from core.model_providers.error import LLMBadRequestError
from core.model_providers.providers.base import BaseModelProvider
from core.model_providers.models.embedding.base import BaseEmbedding
from core.third_party.langchain.embeddings.bobfintechai_embedding import BOBFinTechAIEmbeddings


class BobFinTechAIEmbedding(BaseEmbedding):
    def __init__(self, model_provider: BaseModelProvider, name: str):
        client = BOBFinTechAIEmbeddings(
            model=name,
        )

        super().__init__(model_provider, client, name)

    def handle_exceptions(self, ex: Exception) -> Exception:
        return LLMBadRequestError(f"Bob FinTech AI embedding: {str(ex)}")
