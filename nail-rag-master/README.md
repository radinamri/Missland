# Nail RAG Service

A Retrieval-Augmented Generation (RAG) service for nail design advice, powered by GPT-5.1, Weaviate vector database, and FastAPI.

## Features

- **RAG-based Q&A**: Answer questions about nail design using a curated dataset
- **Image Analysis**: Upload nail images for personalized advice using GPT-5.1 vision
- **Multilingual Support**: Seamless Finnish, Swedish, and English language support (handled automatically by GPT-5.1)
- **Dynamic Greeting Logic**: Intelligent greeting handling based on message number and query content
- **Real-time Chat**: WebSocket streaming for interactive conversations
- **Conversation Memory**: Short-term memory (last 10 messages) for context-aware responses
- **Explore Link Generation**: Automatically extracts nail design parameters from conversations and generates filter URLs for the explore page
- **Advanced Search**: Hybrid search (vector + BM25) across 4 specialized collections
- **Optimizations**: Query expansion, category routing, response caching, and reranking

## Architecture

```text
nail_rag/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Configuration settings
│   ├── constants.py            # Application constants
│   ├── logger.py               # Logging setup
│   ├── models/                 # Database models
│   ├── services/               # Business logic services
│   ├── routes/                 # API endpoints
│   ├── schemas/                # Pydantic schemas
│   ├── utils/                  # Utility functions
│   ├── prompts/                # Prompt templates
│   └── scripts/                # Utility scripts
├── tests/                      # Test suite
├── datasets/                   # Dataset files
└── requirements.txt            # Python dependencies
```

## Prerequisites

- Python 3.10+
- Weaviate (v4+) - Vector database
- OpenAI API key (for GPT-5.1)
- Conda (recommended) or Python virtual environment

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nail_rag
```

### 2. Set Up Environment

```bash
# Activate conda environment
conda activate LLM

# Or create a new environment
conda create -n LLM python=3.10
conda activate LLM
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Weaviate Configuration
WEAVIATE_HOST=localhost
WEAVIATE_PORT=8080
WEAVIATE_SCHEME=http
WEAVIATE_API_KEY=

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5.1
EMBEDDING_MODEL=text-embedding-3-small

# CORS Configuration
ALLOWED_ORIGINS=*

# Explore Page Configuration
EXPLORE_BASE_URL=http://46.249.102.155

# Optional: Customize RAG parameters
MAX_CONTEXTS_PER_QUERY=8
SIMILARITY_SCORE_THRESHOLD=0.75
MAX_TOKENS_RESPONSE=1000
TEMPERATURE_RAG=0.7
```

### 5. Start Weaviate

#### Option A: Using Docker (Recommended)

```bash
docker run -d \
  --name weaviate \
  -p 8080:8080 \
  -p 50051:50051 \
  -e QUERY_DEFAULTS_LIMIT=25 \
  -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
  -e PERSISTENCE_DATA_PATH=/var/lib/weaviate \
  -e DEFAULT_VECTORIZER_MODULE=none \
  -e ENABLE_MODULES=text2vec-openai \
  -e CLUSTER_HOSTNAME=node1 \
  semitechnologies/weaviate:latest
```

#### Option B: Using Docker Compose

```bash
docker-compose up -d weaviate
```

### 6. Import Dataset

```bash
# Run bulk import script
python -m app.scripts.bulk_import
```

This will:
- Create 4 Weaviate collections (one per dataset category)
- Chunk and import all documents
- Skip already imported documents

### 7. Start the Application

```bash
# Development mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python -m app.main
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, access:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Testing

### Run All Tests

```bash
conda activate LLM
pytest tests/ -v
```


## Docker Deployment

### Quick Start with Docker Compose

1. **Create `.env` file** with your OpenAI API key:
   ```bash
   echo "OPENAI_API_KEY=your_key_here" > .env
   ```

2. **Start services**:
   ```bash
   docker-compose up -d
   ```

3. **Import dataset** (after services are up):
   ```bash
   docker-compose exec nail-rag-api python -m app.scripts.bulk_import
   ```

4. **Access the API**:
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - Weaviate: http://localhost:8080

### Build Docker Image Manually

```bash
docker build -t nail-rag-service .
docker run -p 8000:8000 --env-file .env nail-rag-service
```

### Docker Compose Services

- **weaviate**: Vector database (port 8080, 50051)
- **nail-rag-api**: FastAPI application (port 8000)

### Environment Variables for Docker

Set environment variables in `.env` file (loaded automatically by docker-compose).

## Project Structure

### Services

- **`rag_service.py`**: Core RAG logic (retrieval + generation) with multilingual and greeting support
- **`weaviate_service.py`**: Weaviate operations (collections, search, import)
- **`chat_service.py`**: Chat message processing and streaming with explore link generation
- **`image_service.py`**: Image analysis with GPT-5.1 vision
- **`conversation_manager.py`**: Short-term conversation memory management (in-memory)
- **`category_routing_service.py`**: Query routing to relevant collections
- **`response_cache_service.py`**: Response caching
- **`embedding_service.py`**: Text embedding generation
- **`startup_service.py`**: Application initialization

### Utilities

- **`link_generator.py`**: Extracts nail design parameters from conversations and generates explore page filter URLs
- **`openai_client.py`**: OpenAI client factory and management
- **`prompt_loader.py`**: Centralized prompt loading and caching

### Collections

The service uses 4 Weaviate collections:

1. **NailColorTheory**: Color theory & outfit matching
2. **NailSkinTone**: Skin tone-based nail color advice
3. **NailSeasonal**: Seasonal & occasion-based advice
4. **NailShape**: Hand/finger shape & nail design advice

## Configuration

Key configuration options in `app/config.py`:

- **RAG Parameters**: `max_contexts_per_query`, `similarity_score_threshold`
- **Optimization Flags**: `CACHING_ENABLED`, `QUERY_EXPANSION_ENABLED`, `CATEGORY_ROUTING_ENABLED`
- **Memory Settings**: `short_term_memory_limit` (default: 10 messages, in-memory only)
- **Explore Page**: `EXPLORE_BASE_URL` (default: http://46.249.102.155)

### Prompt Files

Prompts are stored in `app/prompts/`:
- **`rag_system.txt`**: Main RAG system prompt with multilingual and greeting logic
- **`image_analysis.txt`**: Image analysis prompt for GPT-5.1 vision
- **`parameter_extraction.txt`**: Parameter extraction prompt for explore link generation

## Language & Greeting Features

### Multilingual Support

The service automatically handles three languages:
- **English**: Default language
- **Finnish (Suomi)**: Automatic detection and response
- **Swedish (Svenska)**: Automatic detection and response

Multilingual support is handled seamlessly by GPT-5.1 in the main RAG prompt - no separate translation service is needed. The model automatically detects the user's language and responds in the same language.

### Dynamic Greeting Logic

The service intelligently handles greetings based on:
- **Message number**: First, second, or third message in the conversation
- **Query content**: Whether the user is greeting, asking a question, or both

Greeting behavior:
- **First message with only greeting**: Simple, warm greeting response
- **First/second/third message with greeting + question**: Brief greeting followed by answer
- **Direct question without greeting**: Skip greeting and answer directly

This logic is handled in the RAG prompt for natural, context-aware responses.

## Explore Link Generation

The service automatically extracts nail design parameters from conversations and generates filter URLs for the frontend explore page.

### How It Works

1. **Parameter Extraction**: After generating a response, the system analyzes the conversation to extract:
   - **Shape**: almond, square, round, coffin, stiletto
   - **Pattern**: french, glossy, matte, ombre, mixed
   - **Size**: short, medium, long
   - **Colors**: red, pink, orange, yellow, green, turquoise, blue, purple, cream, brown, white, gray, black, unknown

2. **Link Generation**: If sufficient parameters are extracted (confidence > 0.3), a filter URL is generated:
   ```
   http://46.249.102.155/filter/?shape=almond&colors=pink,white&pattern=french&size=medium
   ```

3. **Response**: The `explore_link` field is included in API responses when available.

### Valid Parameter Values

- **Shapes**: almond, square, round, coffin, stiletto
- **Patterns**: french, glossy, matte, ombre, mixed
- **Sizes**: short, medium, long
- **Colors**: red, pink, orange, yellow, green, turquoise, blue, purple, cream, brown, white, gray, black, unknown

### Constraints

- Only **ONE** shape, pattern, and size allowed per link
- **MULTIPLE** colors allowed
- Parameters are validated against allowed values
- Links are only generated when user expresses clear preferences or assistant makes specific recommendations

### Configuration

Set the explore page base URL via environment variable:
```env
EXPLORE_BASE_URL=http://46.249.102.155
```


## Performance Optimizations

- **Query Expansion**: Generates query variants for better retrieval
- **Category Routing**: Routes queries to 1-2 most relevant collections
- **Response Caching**: LRU cache for frequent queries (100 entries, 5 min TTL)
- **Context Reranking**: Enhanced scoring combining similarity + keyword matching
- **Parallel Processing**: Concurrent searches across collections
- **Answer Quality Validation**: Scores answers for completeness and relevance
- **Simplified Architecture**: Multilingual support handled directly in RAG prompt (no separate service) for reduced latency

## Development

### Code Style

- Follow PEP 8
- Use type hints
- Async/await for I/O operations
- Proper error handling and logging

### Adding New Features

1. Create service in `app/services/`
2. Add routes in `app/routes/`
3. Define schemas in `app/schemas/`
4. Add tests in `tests/`
5. Update documentation

## Troubleshooting

### Weaviate Connection Issues

```bash
# Check if Weaviate is running
curl http://localhost:8080/v1/.well-known/ready

# Check Weaviate logs
docker logs weaviate
```

### Import Errors

- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check Python version: `python --version` (should be 3.10+)
- Verify conda environment is activated: `conda activate LLM`

### API Key Issues

- Verify `OPENAI_API_KEY` is set in `.env`
- Check API key is valid and has credits
- Ensure GPT-5.1 model access is enabled

## Quick Reference

### Start Services
```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Or manually
uvicorn app.main:app --reload
```

### Import Data
```bash
python -m app.scripts.bulk_import
```

### Run Tests
```bash
conda activate LLM
pytest tests/ -v
```

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Frontend Guide: See `FRONTEND_INTEGRATION.md`
- Link Generation: See `LINK_GENERATION_IMPLEMENTATION.md`
