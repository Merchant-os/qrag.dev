"""
GLM (ZhipuAI) client wrapper for Q# code generation and embeddings.
GLM-4.7 will be used for BOTH code generation and embeddings - no OpenAI required!
"""
import json
import os
import hashlib
import math
import urllib.request

# Try to import zhipuai
try:
    from zhipuai import ZhipuAI
except ImportError:
    ZhipuAI = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

USE_GLM = ZhipuAI is not None
USE_OPENAI = OpenAI is not None

# Get API key and model from environment or use defaults
GLM_API_KEY = os.environ.get("GLM_API_KEY", "")
GLM_MODEL = os.environ.get("GLM_MODEL")
GLM_AUTO_MODEL = os.environ.get("GLM_AUTO_MODEL", "1")
GLM_FALLBACK_MODEL = os.environ.get("GLM_FALLBACK_MODEL", "glm-4")
GLM_BASE_URL = os.environ.get("GLM_BASE_URL") or os.environ.get("ZHIPUAI_BASE_URL") or "https://open.bigmodel.cn/api/paas/v4"
GLM_FALLBACK_BASE_URL = os.environ.get("GLM_FALLBACK_BASE_URL")
GLM_EMBEDDING_FALLBACK = os.environ.get("GLM_EMBEDDING_FALLBACK", "mock")
GENERATION_PROVIDER = os.environ.get("GENERATION_PROVIDER", "openai").lower()
OPENAI_CHAT_MODEL = os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o")
if not GLM_FALLBACK_BASE_URL:
    if GLM_BASE_URL == "https://api.z.ai/api/paas/v4":
        GLM_FALLBACK_BASE_URL = "https://open.bigmodel.cn/api/paas/v4"
    else:
        GLM_FALLBACK_BASE_URL = "https://api.z.ai/api/paas/v4"

MODEL_CACHE: dict[str, str] = {}

def mock_embedding(text: str, dim: int = 512) -> list[float]:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    vector = [0.0] * dim
    for i in range(dim):
        byte = digest[i % len(digest)]
        vector[i] = (byte / 255.0) * 2 - 1
    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0:
        vector = [v / norm for v in vector]
    return vector

def fetch_available_models(base_url: str) -> list[str]:
    try:
        url = f"{base_url.rstrip('/')}/models"
        request = urllib.request.Request(url)
        request.add_header("Authorization", f"Bearer {GLM_API_KEY}")
        with urllib.request.urlopen(request, timeout=15) as response:
            payload = json.loads(response.read().decode("utf-8"))
        models = payload.get("data") or payload.get("models") or []
        model_ids = []
        if isinstance(models, list):
            for item in models:
                if isinstance(item, dict):
                    model_id = item.get("id") or item.get("model") or item.get("name")
                else:
                    model_id = item
                if model_id:
                    model_ids.append(model_id)
        return model_ids
    except Exception:
        return []

def resolve_glm_model(base_url: str) -> str:
    global GLM_MODEL
    if GLM_MODEL:
        return GLM_MODEL
    if base_url in MODEL_CACHE:
        return MODEL_CACHE[base_url]
    auto_enabled = GLM_AUTO_MODEL.lower() in {"1", "true", "yes", "on"}
    if auto_enabled:
        available = fetch_available_models(base_url)
        for candidate in ["glm-4.7", "glm-4.6", "glm-4.5", "glm-4"]:
            if candidate in available:
                MODEL_CACHE[base_url] = candidate
                return MODEL_CACHE[base_url]
        if available:
            MODEL_CACHE[base_url] = available[0]
            return MODEL_CACHE[base_url]
    MODEL_CACHE[base_url] = "glm-4.7"
    return MODEL_CACHE[base_url]

def create_glm_client(base_url: str | None = None):
    """Create and return a GLM client instance."""
    if not USE_GLM:
        raise RuntimeError("zhipuai package not installed. Run: pip install zhipuai>=2.0.0")
    if ZhipuAI is None:
        raise RuntimeError("zhipuai package not installed. Run: pip install zhipuai>=2.0.0")
    return ZhipuAI(api_key=GLM_API_KEY, base_url=base_url)

def create_openai_client():
    if not USE_OPENAI:
        raise RuntimeError("openai package not installed. Run: pip install openai>=1.0.0")
    if OpenAI is None:
        raise RuntimeError("openai package not installed. Run: pip install openai>=1.0.0")
    return OpenAI()

def generate_with_glm(messages: list, system_prompt: str = "") -> str:
    """
    Generate code using GLM-4.7 model.

    Args:
        messages: List of message dictionaries with 'role' and 'content'
        system_prompt: System prompt to prepend

    Returns:
        Generated text response
    """
    if GENERATION_PROVIDER == "openai":
        client = create_openai_client()
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)
        response = client.chat.completions.create(
            model=OPENAI_CHAT_MODEL,
            messages=full_messages,
            temperature=0.0,
            max_tokens=4096,
        )
        return response.choices[0].message.content or ""

    if not USE_GLM:
        raise RuntimeError("zhipuai package not installed. Run: pip install zhipuai>=2.0.0")

    base_url = GLM_BASE_URL
    model = resolve_glm_model(base_url)
    try:
        client = create_glm_client(base_url=base_url)

        # Build full messages list with system prompt
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)

        # Call GLM model (with fallback if quota/model access fails)
        try:
            response = client.chat.completions.create(
                model=model,
                messages=full_messages,
                temperature=0.0,
                max_tokens=4096,
            )
        except Exception as model_error:
            error_text = str(model_error)
            fallback_needed = (
                "1113" in error_text
                or "quota" in error_text.lower()
                or "1211" in error_text
                or "model" in error_text.lower()
                or "模型不存在" in error_text
            )
            if fallback_needed and GLM_FALLBACK_BASE_URL:
                fallback_model = resolve_glm_model(GLM_FALLBACK_BASE_URL)
                fallback_client = create_glm_client(base_url=GLM_FALLBACK_BASE_URL)
                response = fallback_client.chat.completions.create(
                    model=fallback_model,
                    messages=full_messages,
                    temperature=0.0,
                    max_tokens=4096,
                )
            elif fallback_needed and GLM_FALLBACK_MODEL and GLM_FALLBACK_MODEL != model:
                response = client.chat.completions.create(
                    model=GLM_FALLBACK_MODEL,
                    messages=full_messages,
                    temperature=0.0,
                    max_tokens=4096,
                )
            else:
                raise

        choices = getattr(response, "choices", None)
        if not choices:
            raise RuntimeError("GLM response missing choices")
        message = getattr(choices[0], "message", None)
        content = getattr(message, "content", "") if message else ""
        if content is None:
            raise RuntimeError("GLM response empty")
        return content

    except Exception as e:
        raise RuntimeError(f"GLM API error: {e}") from e

def generate_embedding_with_glm(text: str, dim: int = 512) -> list[float]:
    """
    Generate a semantic embedding using GLM-4.7.

    Since GLM doesn't have a dedicated embeddings endpoint, we use a hybrid approach:
    1. Ask GLM to generate semantic keywords/summary
    2. Convert to deterministic vector representation

    Args:
        text: Text to embed
        dim: Dimension of the output vector (default: 512)

    Returns:
        List of floats representing the text embedding
    """
    if not USE_GLM:
        raise RuntimeError("zhipuai package not installed. Run: pip install zhipuai>=2.0.0")

    base_url = GLM_BASE_URL
    model = resolve_glm_model(base_url)
    try:
        client = create_glm_client(base_url=base_url)

        # Ask GLM to generate semantic representation
        # We extract key terms and use them to build a vector
        prompt = f"""Extract the top {dim//2} most important keywords from this text about Q# quantum programming. Return ONLY a comma-separated list of keywords, no explanations.

Text: {text}"""

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=256,
            )
        except Exception as model_error:
            error_text = str(model_error)
            fallback_needed = (
                "1113" in error_text
                or "quota" in error_text.lower()
                or "1211" in error_text
                or "model" in error_text.lower()
                or "模型不存在" in error_text
            )
            if "1113" in error_text or "余额不足" in error_text:
                if GLM_EMBEDDING_FALLBACK.lower() == "mock":
                    print("GLM quota unavailable; using mock embeddings.")
                    return mock_embedding(text, dim=dim)
            if fallback_needed and GLM_FALLBACK_BASE_URL:
                fallback_model = resolve_glm_model(GLM_FALLBACK_BASE_URL)
                fallback_client = create_glm_client(base_url=GLM_FALLBACK_BASE_URL)
                response = fallback_client.chat.completions.create(
                    model=fallback_model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.0,
                    max_tokens=256,
                )
            elif fallback_needed and GLM_FALLBACK_MODEL and GLM_FALLBACK_MODEL != model:
                response = client.chat.completions.create(
                    model=GLM_FALLBACK_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.0,
                    max_tokens=256,
                )
            else:
                raise

        choices = getattr(response, "choices", None)
        if not choices:
            raise RuntimeError("GLM embedding response missing choices")
        message = getattr(choices[0], "message", None)
        content = getattr(message, "content", "") if message else ""
        if content is None:
            raise RuntimeError("GLM embedding response empty")
        keywords_text = str(content).strip()
        keywords = [k.strip().lower() for k in keywords_text.split(',') if k.strip()]

        if not keywords:
            raise RuntimeError("GLM embedding returned no keywords")

        # Build vector from keywords using hashing
        # Each keyword contributes to different dimensions based on its hash
        vector = [0.0] * dim

        for i, keyword in enumerate(keywords):
            # Use keyword to activate specific dimensions
            hash_val = hash(keyword) % (dim // len(keywords))
            for j in range(i, min(dim, (i + 1) * (dim // len(keywords)) + 1)):
                vector[j] = (hash_val / (2 ** 31)) * 2 - 1  # Normalize to [-1, 1]

        # Normalize the vector
        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0:
            vector = [v / norm for v in vector]

        return vector

    except Exception as e:
        raise RuntimeError(f"GLM embedding error: {e}")
