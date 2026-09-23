#include <dlfcn.h>
#include <iostream>
#include <map>
#include <string>

using TestFunction = void (*)(const std::map<std::string, std::string>&);

static void call(void* handle, const char* name, const std::map<std::string, std::string>& params) {
    auto func = reinterpret_cast<TestFunction>(dlsym(handle, name));
    if (!func) {
        std::cerr << "Missing symbol " << name << ": " << dlerror() << std::endl;
        return;
    }
    func(params);
    std::cout << "✅ " << name << " executed" << std::endl;
}

int main() {
    std::cout << "🛠️  Test Stub started" << std::endl;

    void* dllHandle = dlopen("./dll/wifi_test.dll", RTLD_LAZY);
    if (!dllHandle) {
        std::cerr << "Failed to load test DLL: " << dlerror() << std::endl;
        return 1;
    }

    call(dllHandle, "open_dut_port", {{"port", "10"}, {"sleep_ms", "200"}, {"port_desc", "diag port"}});
    call(dllHandle, "connect_instrument", {{"ip", "192.168.1.100"}, {"timeout_ms", "3000"}});
    call(dllHandle, "set_band", {{"band", "2.4G"}, {"reset", "true"}});
    call(dllHandle, "get_input_params", {{"mode", "1"}});
    call(dllHandle, "check_test_flag", {{"test_info", "40"}, {"sleep_ms", "200"}, {"mode", "1"}});
    call(dllHandle, "measure_tx_power", {{"channel", "6"}, {"target_dbm", "18.5"}});
    call(dllHandle, "measure_evm", {{"channel", "6"}, {"rate", "MCS7"}, {"limit_db", "-28"}});
    call(dllHandle, "measure_rx_sensitivity", {{"channel", "6"}, {"packet_count", "1000"}, {"enable_log", "true"}});
    call(dllHandle, "close_dut_port", {});

    dlclose(dllHandle);
    return 0;
}
