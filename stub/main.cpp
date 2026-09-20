#include <dlfcn.h>
#include <iostream>
#include <string>
#include <map>
#include <functional>

using TestFunction = void (*)(const std::map<std::string, std::string>& params);

int main() {
    std::cout << "🛠️  Test Stub started" << std::endl;

    void* dllHandle = dlopen("./dll/wifi_test.dll", RTLD_LAZY);
    if (!dllHandle) {
        std::cerr << "Failed to load test DLL: " << dlerror() << std::endl;
        return 1;
    }

    // 模拟调用
    auto func = reinterpret_cast<TestFunction>(dlsym(dllHandle, "open_dut_port"));
    if (func) {
        std::map<std::string, std::string> params = {
            {"port", "10"},
            {"sleep_ms", "200"},
            {"port_desc", "diag port"}
        };
        func(params);
        std::cout << "✅ Function open_dut_port executed" << std::endl;
    }

    dlclose(dllHandle);
    return 0;
}
