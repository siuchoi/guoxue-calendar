#!/bin/bash
# 观玄·国学日历 全量回归（387 项断言）
# 语料来源：https://github.com/superzhang21/metaphysics-steward (MIT)
cd "$(dirname "$0")/.." || exit 1
mkdir -p .test
echo '{ "type": "commonjs" }' > .test/package.json
./node_modules/.bin/tsc src/lib/liuren.ts src/lib/meihua.ts src/lib/liuyao.ts src/lib/jinkoujue.ts src/lib/qimen.ts src/lib/ziwei.ts src/lib/bazi.ts src/lib/hehun.ts \
  --outDir .test --module commonjs --target es2020 --skipLibCheck --esModuleInterop --moduleResolution node || exit 1
fail=0
for t in liuren meihua liuyao jinkoujue qimen ziwei bazi hehun; do
  printf "%-10s " "$t"
  node tests/$t/compare.cjs 2>&1 | tail -1
  [ ${PIPESTATUS[0]} -ne 0 ] && fail=1
done
exit $fail
