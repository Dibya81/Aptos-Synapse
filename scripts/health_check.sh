#!/bin/bash
# Comprehensive smoke test for Aptos Synapse services

echo "🔍 Checking Frontend HTTP (:3002)..."
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3002/ | grep 200 && echo "✅ Frontend is UP" || echo "⚠️ Frontend not running"

echo "🔍 Checking Synapse Node API (:3001)..."
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/health | grep 200 && echo "✅ Synapse Node is UP" || echo "⚠️ Synapse Node not running"

echo "🔍 Checking Local Ollama Runtime (:11434)..."
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:11434/api/tags | grep 200 && echo "✅ Ollama is UP" || echo "⚠️ Ollama not running"
