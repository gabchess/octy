FROM node:23.3.0-slim

# Install essential dependencies for the build process
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    ffmpeg \
    g++ \
    git \
    make \
    python3 \
    unzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install bun globally with npm
RUN npm install -g bun

# Add bun global bin to PATH for root and node users
ENV PATH="/root/.bun/bin:/home/node/.bun/bin:$PATH"

# Create a wrapper script for elizaos that uses the local installation
RUN echo '#!/bin/bash\nexec /app/node_modules/.bin/elizaos "$@"' > /usr/local/bin/elizaos && \
    chmod +x /usr/local/bin/elizaos

# Disable telemetry
ENV ELIZAOS_TELEMETRY_DISABLED=true
ENV DO_NOT_TRACK=1
ENV NODE_ENV=production
ENV SERVER_PORT=3000

# Set working directory
WORKDIR /app

# Copy package files and patches before install so postinstall (patch-package) can run
COPY package.json bun.lock* ./
COPY patches/ ./patches/

# Install dependencies (skip postinstall to avoid broken patch-package)
RUN bun install --ignore-scripts

# Apply @ai-sdk/openai patch manually (makes Qwen work as chat model, not reasoning model)
RUN sed -i 's/const isReasoningModel = !(modelId.startsWith("gpt-3") || modelId.startsWith("gpt-4") || modelId.startsWith("chatgpt-4o") || modelId.startsWith("gpt-5-chat"));/const isReasoningModel = !(modelId.startsWith("gpt-3") || modelId.startsWith("gpt-4") || modelId.startsWith("chatgpt-4o") || modelId.startsWith("gpt-5-chat") || modelId.startsWith("Qwen") || modelId.includes("\/"));/g' \
    node_modules/@ai-sdk/openai/dist/index.js \
    node_modules/@ai-sdk/openai/dist/index.mjs 2>/dev/null || true && \
    sed -i 's/return createResponsesModel(modelId);/return createChatModel(modelId);/g' \
    node_modules/@ai-sdk/openai/dist/index.js \
    node_modules/@ai-sdk/openai/dist/index.mjs 2>/dev/null || true

# Copy the rest of the application
COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

# Change ownership of the app directory to node user
RUN chown -R node:node /app

# Create node user's bun directory
RUN mkdir -p /home/node/.bun && chown -R node:node /home/node/.bun

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Start the agent with the production character
CMD ["elizaos", "start", "--character", "./characters/agent.character.json"]
