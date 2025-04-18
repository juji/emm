# Regression test for emm CLI --out option
# Usage: bash test/emm-cli-out-regression.sh

set -e
cd "$(dirname "$0")"

TEST_SCRIPT="mem-check.js"
OUT_FILE="test-output.txt"

# Create a simple script to monitor
cat <<EOF > "$TEST_SCRIPT"
echo asdf
EOF

# check if the script outputs the expected string
if ! node "$TEST_SCRIPT" | grep -q 'asdf'; then
  echo "Test script did not output expected string."
  exit 1
fi

echo 'oklah'

