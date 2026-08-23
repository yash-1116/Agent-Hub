# 🚀 AgentHub — AI Agent Marketplace & Orchestration Platform

AgentHub is a multi-agent AI platform that provides access to specialized AI agents through a single unified platform.

The platform allows users to upload documents, submit information, and run different AI-powered services such as OCR, fraud detection, document summarization, and Personally Identifiable Information (PII) detection.

AgentHub uses a microservice-based architecture where each AI agent runs independently and communicates with the central backend through APIs.

The platform also integrates **x402 payments with the Algorand blockchain**, allowing AI-agent services to be accessed through a pay-per-use payment model.

---

## 🤖 Available AI Agents

AgentHub currently provides four specialized AI agents:

| Agent | Description |
|---|---|
| 🔍 **OCR Agent** | Extracts text from images and scanned documents |
| 🛡️ **Fraud Detection Agent** | Detects suspicious or potentially fraudulent information |
| 📝 **Summary Agent** | Converts long documents and text into concise summaries |
| 🔐 **PII Detection Agent** | Detects personally identifiable and sensitive information |

---

## 🎯 What AgentHub Does

AgentHub connects users with specialized AI agents through a single platform.

A typical request follows this flow:

User

↓

AgentHub Frontend

↓

Backend API

↓

Agent Orchestrator

↓

Selected AI Agent

↓

AI Processing

↓

Result

↓

Frontend

If payment is required, the request also passes through the **x402 payment infrastructure**, which handles payment verification and settlement through the Algorand network.

---

## 🌟 Why AgentHub?

Instead of building and integrating separate AI services for every task, AgentHub provides multiple specialized agents through one platform.

The architecture is designed to be:

- Modular
- Scalable
- Extensible
- API-driven
- Microservice-based
- Payment-enabled

New agents can be added without redesigning the existing payment infrastructure.

---

## 💡 Example

A company receives an invoice as an image.

The invoice can be processed using:

```text
Invoice Image
      ↓
OCR Agent
      ↓
Extracted Text
      ↓
Fraud Detection
      ↓
Risk Analysis
      ↓
PII Detection
      ↓
Sensitive Information
      ↓
Summary Agent
      ↓
Final Summary

## ❗ Problem

Modern businesses increasingly depend on AI services for tasks such as document processing, text analysis, fraud detection, and sensitive-data identification.

However, using these services often creates several problems:

- Different AI services require different APIs and integrations.
- Businesses need to manage multiple AI systems separately.
- Document-processing workflows can become complex.
- There is no simple unified interface for accessing specialized AI agents.
- Integrating payments into AI services can be complicated.
- Scaling and adding new AI capabilities can require significant changes to an existing application.
- Users may need to manually move data between different AI services.

For example, a company processing invoices may need one service for OCR, another for fraud detection, another for PII detection, and another for summarization.

Managing these services independently increases development complexity and operational overhead.

---

## ✅ Solution

AgentHub solves this problem by providing a **single platform for multiple specialized AI agents**.

Instead of integrating every AI service separately, users can access different agents through the AgentHub platform.

The platform provides:

- A unified frontend
- A central backend API
- An agent orchestration layer
- Independent AI-agent microservices
- API-based communication between services
- Pay-per-use AI services
- x402 payment integration
- Algorand Testnet payment settlement

Each agent is designed to perform a specific task.

For example:

```text
                    ┌─────────────────────┐
                    │      AgentHub       │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Backend API      │
                    │   Orchestration     │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
        OCR Agent        Fraud Agent       Summary Agent
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                               ▼
                       PII Detection Agent
## 👥 Target Users

AgentHub is designed for individuals, developers, startups, and businesses that need access to multiple AI-powered services without integrating every service separately.

### 1. 🏢 Businesses

Businesses can use AgentHub for automated document processing, fraud analysis, sensitive-data detection, and document summarization.

Example:

```text
Business Document
       ↓
OCR
       ↓
Fraud Detection
       ↓
PII Detection
       ↓
Summary
## 🏗️ System Architecture

AgentHub follows a modular microservice architecture.

```text
                         ┌──────────────────────┐
                         │        USER          │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      FRONTEND        │
                         │      Next.js         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    BACKEND API       │
                         │   Node.js / Express  │
                         └──────────┬───────────┘
                                    │
                           ┌────────┴────────┐
                           │                 │
                           ▼                 ▼
                  ┌────────────────┐  ┌───────────────┐
                  │   x402 Payment  │  │  Orchestrator │
                  │    Layer       │  │               │
                  └───────┬────────┘  └───────┬───────┘
                          │                    │
                          ▼                    ▼
                  ┌───────────────┐    ┌─────────────────┐
                  │   Algorand    │    │   AI Agents     │
                  │    Network    │    └────────┬────────┘
                  └───────────────┘             │
                                      ┌──────────┼──────────┐
                                      │          │          │
                                      ▼          ▼          ▼
                                   ┌──────┐  ┌────────┐  ┌─────────┐
                                   │ OCR  │  │ Fraud  │  │Summary  │
                                   │Agent │  │ Agent  │  │ Agent   │
                                   └──────┘  └────────┘  └─────────┘
                                      │          │          │
                                      └──────────┼──────────┘
                                                 │
                                                 ▼
                                          ┌────────────┐
                                          │ PII Agent  │
                                          └────────────┘
                                                 │
                                                 ▼
                                      ┌──────────────────┐
                                      │   Agent Result   │
                                      └────────┬─────────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │     Frontend     │
                                      
                                      └──────────────────┘
## 🛠️ Tech Stack

### Frontend

- **Next.js**
- **React**
- **JavaScript**
- **HTML / CSS**

The frontend provides the user interface for selecting AI agents, uploading documents, submitting requests, and displaying agent results.

---

### Backend

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **CORS**
- **Helmet**
- **Morgan**

The backend provides the central API layer and handles:

- Agent discovery
- Agent routing
- Workflow orchestration
- API requests
- Payment processing
- Workflow records
- Invocation records
- Transaction records

---

### AI Agent Services

Each AI agent is implemented as an independent microservice.

| Agent | Technology / Purpose |
|---|---|
| OCR Agent | Python + Tesseract OCR |
| Fraud Detection Agent | Python-based AI processing |
| Summary Agent | Python-based text processing |
| PII Detection Agent | Python-based sensitive-data detection |

---

### OCR

The OCR Agent uses:

- **Tesseract OCR**
- **pytesseract**
- **Pillow**

It processes images and scanned documents and extracts readable text.

---

### Payments

AgentHub uses:

- **x402 Payment Protocol**
- **@x402/express**
- **@x402/core**
- **@x402/avm**
- **Algorand**
- **USDC**

The payment layer enables pay-per-use access to AI-agent services.

---

### Database

AgentHub uses **MongoDB** for storing application and payment-related information.

The backend maintains records such as:

```text
Users
Workflows
Invocations
Payments
Transactions
Agents

## 🛠️ Tech Stack

### Frontend

- **Next.js**
- **React**
- **JavaScript**
- **HTML / CSS**

The frontend provides the user interface for selecting AI agents, uploading documents, submitting requests, and displaying agent results.

---

### Backend

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **CORS**
- **Helmet**
- **Morgan**

The backend provides the central API layer and handles:

- Agent discovery
- Agent routing
- Workflow orchestration
- API requests
- Payment processing
- Workflow records
- Invocation records
- Transaction records

---

### AI Agent Services

Each AI agent is implemented as an independent microservice.

| Agent | Technology / Purpose |
|---|---|
| OCR Agent | Python + Tesseract OCR |
| Fraud Detection Agent | Python-based AI processing |
| Summary Agent | Python-based text processing |
| PII Detection Agent | Python-based sensitive-data detection |

---

### OCR

The OCR Agent uses:

- **Tesseract OCR**
- **pytesseract**
- **Pillow**

It processes images and scanned documents and extracts readable text.

---

### Payments

AgentHub uses:

- **x402 Payment Protocol**
- **@x402/express**
- **@x402/core**
- **@x402/avm**
- **Algorand**
- **USDC**

The payment layer enables pay-per-use access to AI-agent services.

---

### Database

AgentHub uses **MongoDB** for storing application and payment-related information.

The backend maintains records such as:

```text
Users
Workflows
Invocations
Payments
Transactions
Agents

## 🎯 Use Cases

AgentHub is designed for real-world document and business automation scenarios where multiple AI capabilities are required.

### 1. Invoice Processing

A company can upload an invoice and use multiple agents to process it automatically.

```text
Invoice
   ↓
OCR Agent
   ↓
Extracted Text
   ↓
┌───────────────┬────────────────┬───────────────┐
│               │                │               │
▼               ▼                ▼               │
Summary       Fraud Check     PII Detection     │
│               │                │               │
└───────────────┴────────────────┴───────────────┘
                       ↓
                 Final Analysis

## 🏆 Key Advantages

AgentHub provides several advantages over using individual AI services separately.

### 1. Unified AI Platform

Users can access multiple specialized AI agents through a single platform instead of integrating each service independently.

### 2. Modular Architecture

Each agent is an independent service, making it easier to:

- Add new agents
- Update existing agents
- Debug individual services
- Scale specific agents
- Deploy agents independently

### 3. Pay-Per-Use Model

The x402 payment integration allows AI services to support usage-based payments.

Users can pay for the service when they use it rather than requiring a fixed subscription model.

### 4. Blockchain-Based Payments

Payments are integrated with the Algorand network, providing an on-chain settlement layer for AI-agent usage.

### 5. Specialized AI Services

Instead of relying on one general-purpose service, AgentHub provides specialized agents for different tasks:

```text
OCR
 │
 ├── Document Text Extraction
 │
Fraud Detection
 │
 ├── Suspicious Data Analysis
 │
Summary
 │
 ├── Text Summarization
 │
PII Detection
 │
 └── Sensitive Information Detection

 ## 📁 Project Structure

```text
Agent-Hub/
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── ...
│   ├── models/
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── agents/
│   │       ├── workflow/
│   │       ├── page.js
│   │       └── ...
│   ├── package.json
│   └── ...
│
├── ai-services/
│   │
│   ├── ocr-agent/
│   │   ├── app/
│   │   │   └── main.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── fraud-agent/
│   │   ├── app/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── summary-agent/
│   │   ├── app/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   └── pii-agent/
│       ├── app/
│       │   └── main.py
│       ├── requirements.txt
│       └── Dockerfile
│
├── docker/
│   └── compose.yml
│
├── .env.example
├── .gitignore
└── README.md

## 🛠️ Installation & Local Setup

Follow the steps below to run AgentHub locally.

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- Python 3.x
- Git
- Docker Desktop
- MongoDB
- Tesseract OCR
- An Algorand-compatible wallet for Testnet payments

Check the installed versions:

```bash
node --version
npm --version
python --version
git --version
docker --version
## 🧪 Testing

AgentHub can be tested at multiple levels, including individual AI agents, backend APIs, workflows, and the complete application.

---

## 1. Test Backend Health

Start the backend and verify that the health endpoint is working.

```bash
curl http://localhost:YOUR_BACKEND_PORT/api/health
## 🧪 Testing

AgentHub can be tested at multiple levels, including individual AI agents, backend APIs, workflows, and the complete application.

---

## 1. Test Backend Health

Start the backend and verify that the health endpoint is working.

```bash
curl http://localhost:YOUR_BACKEND_PORT/api/health

## 🌐 API Overview

AgentHub exposes backend APIs that connect the frontend, payment layer, orchestration system, and AI-agent services.

### Main API Areas

```text
/api/health
/api/agents
/api/orchestrate
## 🚀 Deployment

AgentHub can be deployed as a multi-service application consisting of the frontend, backend, AI agents, database, and payment infrastructure.

### Deployment Architecture

```text
                         Internet
                            │
                            ▼
                    ┌───────────────┐
                    │    Frontend   │
                    │    Next.js    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    Backend    │
                    │   Express.js  │
                    └───────┬───────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        OCR Agent      Fraud Agent    Summary Agent
             │              │              │
             └──────────────┼──────────────┘
                            │
                            ▼
                       PII Agent
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
          MongoDB                    x402 Facilitator
                                           │
                                           ▼
                                      Algorand
