# Synapse - AI-Powered No-Code Study Workflow Platform

![Synapse Logo](https://via.placeholder.com/200x80/4F46E5/FFFFFF?text=Synapse)

## 🚀 Overview

Synapse is a revolutionary no-code platform that empowers learners to create personalized AI-powered study workflows through an intuitive visual interface. Build, connect, and execute custom learning tools without writing a single line of code.

### ✨ Key Features

- **🎨 Visual Canvas Interface**: Drag-and-drop blocks to create complex workflows
- **🤖 AI-Powered Blocks**: Leverage GPT-4, Claude, and other AI models for intelligent content processing
- **📚 Study-Focused**: Pre-built blocks for summarization, quiz generation, flashcards, and more
- **👥 Community Hub**: Share and discover workflows created by other learners
- **⚡ Real-time Execution**: Watch your workflows run with live progress tracking
- **🔒 Secure & Scalable**: Enterprise-grade security with horizontal scaling capabilities

## 🏗️ Architecture

Synapse follows a microservices architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Core Service  │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼─────┐
        │  Workflow    │ │   Block     │ │    AI     │
        │  Service     │ │  Service    │ │  Service  │
        │  (Node.js)   │ │  (Node.js)  │ │ (Python)  │
        └──────────────┘ └─────────────┘ └───────────┘
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼─────┐
        │  Execution   │ │ PostgreSQL  │ │  MongoDB  │
        │   Engine     │ │ (Metadata)  │ │(Workflows)│
        │  (Node.js)   │ └─────────────┘ └───────────┘
        └──────────────┘         │               │
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼─────┐
        │    Redis     │ │    MinIO    │ │  Auth0    │
        │ (Cache/Queue)│ │ (File Store)│ │ (Auth)    │
        └──────────────┘ └─────────────┘ └───────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 20.0.0 or higher
- **Docker**: 20.10.0 or higher
- **Docker Compose**: 2.0.0 or higher
- **Git**: Latest version

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/synapse.git
cd synapse
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables (optional for development)
nano .env
```

### 3. Start Development Environment

```bash
# Start all services with Docker Compose
npm run docker:dev

# Or start individual services
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **MinIO Console**: http://localhost:9001 (admin/admin)

## 📖 Detailed Setup Instructions

### Option 1: Docker Development (Recommended)

This is the easiest way to get started with all services running in containers.

```bash
# 1. Clone and navigate to project
git clone https://github.com/your-org/synapse.git
cd synapse

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
npm run docker:dev

# 4. Wait for all services to be healthy
# Check logs if needed: docker-compose -f docker-compose.dev.yml logs -f
```

### Option 2: Local Development

For developers who prefer running services locally.

#### Prerequisites Setup

```bash
# Install Node.js dependencies
npm install

# Install dependencies for each service
cd frontend && npm install && cd ..
cd services/api-gateway && npm install && cd ../..
cd services/core && npm install && cd ../..
cd services/workflow && npm install && cd ../..
cd services/block && npm install && cd ../..
cd services/execution-engine && npm install && cd ../..

# Install Python dependencies for AI service
cd services/ai && pip install -r requirements.txt && cd ../..
```

#### Database Setup

```bash
# Start databases with Docker
docker-compose -f docker-compose.dev.yml up postgres mongo redis minio -d

# Wait for databases to be ready (about 30 seconds)
sleep 30

# Initialize database schema
docker exec synapse-postgres-1 psql -U synapse -d synapse -f /docker-entrypoint-initdb.d/init.sql
```

#### Start Services

```bash
# Terminal 1: API Gateway
cd services/api-gateway && npm run dev

# Terminal 2: Core Service
cd services/core && npm run dev

# Terminal 3: Workflow Service
cd services/workflow && npm run dev

# Terminal 4: Block Service
cd services/block && npm run dev

# Terminal 5: AI Service
cd services/ai && uvicorn main:app --host 0.0.0.0 --port 3004 --reload

# Terminal 6: Execution Engine
cd services/execution-engine && npm run dev

# Terminal 7: Frontend
cd frontend && npm run dev
```

## 🎯 Usage Guide

### Creating Your First Workflow

1. **Access the Canvas**: Navigate to http://localhost:3000/canvas
2. **Add Blocks**: Drag blocks from the library to the canvas
3. **Connect Blocks**: Click and drag from output ports to input ports
4. **Configure Blocks**: Click on blocks to configure their settings
5. **Run Workflow**: Click the "Run" button to execute your workflow
6. **View Results**: Watch real-time progress and view outputs

### Available Block Types

#### Input Blocks
- **Text Input**: Enter or paste text content
- **File Upload**: Upload PDF, TXT, or DOC files
- **URL Input**: Fetch content from web pages

#### AI Processing Blocks
- **Summarizer**: Generate concise summaries
- **Question Generator**: Create quiz questions
- **Flashcard Generator**: Generate study flashcards
- **Content Analyzer**: Analyze and categorize content

#### Display Blocks
- **Text Display**: Show formatted text output
- **Quiz Interface**: Interactive quiz with scoring
- **Flashcard Viewer**: Study flashcards with spaced repetition

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18 + shadcn/ui
- **Canvas**: Konva.js + React-Konva
- **State**: Zustand + TanStack Query
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript 5

### Backend
- **Runtime**: Node.js 20 + Python 3.11
- **Frameworks**: Express.js, FastAPI
- **Message Queue**: Bull MQ (Redis-based)
- **WebSocket**: Socket.io
- **Authentication**: Auth0
- **Documentation**: OpenAPI/Swagger

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Databases**: PostgreSQL 15, MongoDB 6, Redis 7
- **File Storage**: MinIO (S3-compatible)
- **Monitoring**: Winston logging
- **CI/CD**: GitHub Actions

## 🚀 Deployment

### Production Deployment

#### Using Docker Compose

```bash
# Build production images
npm run docker:build

# Deploy with production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

#### Required for Production

```bash
# Database URLs
DATABASE_URL=postgres://user:pass@host:5432/synapse
MONGODB_URL=mongodb://host:27017/synapse
REDIS_URL=redis://host:6379

# Authentication
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier

# AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Storage
S3_ENDPOINT=https://your-s3-endpoint.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and request features on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions
- **Email**: Contact us at support@synapse.ai

### Common Issues

#### Services Won't Start
```bash
# Check if ports are available
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000

# Check Docker containers
docker ps -a
docker-compose -f docker-compose.dev.yml logs
```

#### Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.dev.yml ps postgres mongo redis

# Reset databases
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up postgres mongo redis -d
```

---

**Built with ❤️ by the Synapse Team**

For more information, visit [synapse.ai](https://synapse.ai) or join our community on [Discord](https://discord.gg/synapse).