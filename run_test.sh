#!/bin/bash
echo "🚀 Starting Test Engine..."
echo "============================="

# 清理旧构建
echo "Cleaning build dirs..."
rm -rf core/build stub/build

# 编译 core
echo "Compiling C++ core..."
mkdir -p core/build && cd core/build && cmake .. && make -j4 > /dev/null 2>&1 && echo "✅ Core compiled" || echo "❌ Core compile failed"

# 编译 stub
echo "Compiling C++ stub..."
mkdir -p ../stub/build && cd ../stub/build && cmake .. && make -j4 > /dev/null 2>&1 && echo "✅ Stub compiled" || echo "❌ Stub compile failed"

# 启动服务
echo "Starting Thrift server..."
mkdir -p ../core/build && cd ../core/build && ./thrift_server > /tmp/thrift.log 2>&1 &
THRIFT_PID=$!
sleep 2
echo "✅ Thrift server running (PID: $THRIFT_PID)"

# 运行测试
echo "Running test tree..."
cd ../.. && npx tsx src/main.ts run --tree ./simple.json > /tmp/test.log 2>&1
TEST_EXIT=$?

# 停止服务
kill $THRIFT_PID 2>/dev/null || true

echo "============================="
if [ $TEST_EXIT -eq 0 ]; then
    echo "��� Test completed successfully!"
else
    echo "❌ Test failed with exit code $TEST_EXIT"
fi

echo "Logs:"
echo "Thrift: /tmp/thrift.log"
echo "Test: /tmp/test.log"
echo "============================="
EOF
chmod +x run_test.sh && ./run_test.sh