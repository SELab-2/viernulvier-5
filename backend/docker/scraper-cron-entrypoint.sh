#!/bin/sh
set -eu

APP_DIR="/usr/src/app"
LOG_DIR="${APP_DIR}/logs"
CRON_FILE="/etc/crontabs/root"
CRON_SCHEDULE="${SCRAPER_CRON_SCHEDULE:-0 0 * * *}"

mkdir -p "${LOG_DIR}"
touch "${LOG_DIR}/scraper.log"

if ! command -v crond >/dev/null 2>&1; then
  echo "crond is not available in this image" >&2
  exit 1
fi

node <<'EOF'
const fs = require('node:fs');

const outputPath = '/usr/src/app/.env';
const skippedKeys = new Set([
  'HOME',
  'HOSTNAME',
  'OLDPWD',
  'PATH',
  'PWD',
  'SHLVL',
  '_',
]);

const lines = Object.entries(process.env)
  .filter(([key, value]) => value !== undefined && !skippedKeys.has(key))
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([key, value]) => `${key}=${JSON.stringify(value)}`);

fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
EOF

cat > "${CRON_FILE}" <<EOF
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
${CRON_SCHEDULE} cd ${APP_DIR} && /usr/local/bin/npx tsx src/scraper/sync_database.ts >> ${LOG_DIR}/scraper.log 2>&1
EOF

chmod 600 "${CRON_FILE}"

echo "Configured scraper cron schedule: ${CRON_SCHEDULE}"
echo "Scraper logs will be written to ${LOG_DIR}/scraper.log"

exec crond -f -d 8
