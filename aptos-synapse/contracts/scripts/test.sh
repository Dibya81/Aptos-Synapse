#!/usr/bin/env bash
# Aptos Move contract unit test execution
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🧪 Running Aptos Move contract unit tests in ${PACKAGE_DIR}..."
aptos move test --package-dir "${PACKAGE_DIR}" --skip-fetch-latest-git-deps
echo "✅ All Move contract unit tests passed successfully."
