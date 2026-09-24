#include "dll/wifi_test.h"

#include <dlfcn.h>
#include <iostream>
#include <map>
#include <string>

using CreateFn = void* (*)();
using CallFn = unsigned int (*)(void*, const char*, const std::map<std::string, std::string>&);
using CountFn = unsigned int (*)();
using DestroyFn = void (*)(void*);

static int failures = 0;

static void call(CallFn fn, void* obj, const char* name, const std::map<std::string, std::string>& params) {
    const unsigned int code = fn(obj, name, params);
    if (code != 0) {
        std::cerr << "❌ " << name << " failed with code " << code << std::endl;
        failures += 1;
        return;
    }
    std::cout << "✅ " << name << " executed" << std::endl;
}

int main() {
    std::cout << "🛠️  Test Stub started" << std::endl;

    void* dllHandle = dlopen("./dll/wifi_test.dll", RTLD_LAZY);
    if (!dllHandle) {
        std::cerr << "Failed to load test DLL: " << dlerror() << std::endl;
        return 1;
    }

    auto create = reinterpret_cast<CreateFn>(dlsym(dllHandle, "wifi_test_create"));
    auto callFn = reinterpret_cast<CallFn>(dlsym(dllHandle, "wifi_test_call"));
    auto count = reinterpret_cast<CountFn>(dlsym(dllHandle, "wifi_test_count"));
    auto destroy = reinterpret_cast<DestroyFn>(dlsym(dllHandle, "wifi_test_destroy"));
    if (!create || !callFn || !count || !destroy) {
        std::cerr << "Failed to resolve wifi_test entry points: " << dlerror() << std::endl;
        dlclose(dllHandle);
        return 1;
    }

    void* obj = create();
    std::cout << "registry functions: " << count() << std::endl;

    call(callFn, obj, "open_dut_port", {{"port", "10"}, {"sleep_ms", "200"}, {"port_desc", "diag port"}});
    call(callFn, obj, "connect_instrument", {{"ip", "192.168.1.100"}, {"timeout_ms", "3000"}});
    call(callFn, obj, "set_band", {{"band", "2.4G"}, {"reset", "true"}});
    call(callFn, obj, "get_input_params", {{"mode", "1"}});
    call(callFn, obj, "check_test_flag", {{"test_info", "40"}, {"sleep_ms", "200"}, {"mode", "1"}});
    call(callFn, obj, "measure_tx_power", {{"channel", "6"}, {"target_dbm", "18.5"}});
    call(callFn, obj, "measure_evm", {{"channel", "6"}, {"rate", "MCS7"}, {"limit_db", "-28"}});
    call(callFn, obj, "measure_rx_sensitivity", {{"channel", "6"}, {"packet_count", "1000"}, {"enable_log", "true"}});
    call(callFn, obj, "close_dut_port", {});

    destroy(obj);
    dlclose(dllHandle);

    if (failures != 0) {
        std::cerr << failures << " call(s) failed" << std::endl;
        return 1;
    }
    return 0;
}
