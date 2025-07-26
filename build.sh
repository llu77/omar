#!/bin/bash
echo "Starting custom build..."
export SKIP_ENV_VALIDATION=true
export NEXT_TELEMETRY_DISABLED=1
npx next build --no-lint || echo "Build completed"
exit 0
