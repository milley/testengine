#include <iostream>
#include <map>
#include <sstream>
#include <string>

using ParamMap = const std::map<std::string, std::string>&;

static std::string dump(ParamMap params) {
    std::ostringstream out;
    bool first = true;
    for (const auto& item : params) {
        if (!first) out << ", ";
        first = false;
        out << item.first << "=" << item.second;
    }
    if (first) out << "(none)";
    return out.str();
}

static std::string get(ParamMap params, const std::string& key, const std::string& fallback = "") {
    auto it = params.find(key);
    return it == params.end() ? fallback : it->second;
}

/**
 * 模拟 wifi_test.dll（对象方式）。
 * 每个模拟函数都是 WifiTestDll 的非静态成员，返回 unsigned int（0 = PASS）。
 * registry 以 函数名 -> 成员函数句柄 的 key:value 形式登记，调用时绑定到具体对象。
 * 外部只通过 wifi_test_create / wifi_test_call / wifi_test_destroy 使用。
 */
class WifiTestDll {
public:
    using MemberFn = unsigned int (WifiTestDll::*)(ParamMap);

    unsigned int open_dut_port(ParamMap params) {
        std::cout << "[DLL] open_dut_port params: " << dump(params) << std::endl;
        std::cout << "[DLL] result: DUT port " << get(params, "port", "?")
                  << " opened (" << get(params, "port_desc", "port") << ")" << std::endl;
        return 0;
    }

    unsigned int connect_instrument(ParamMap params) {
        std::cout << "[DLL] connect_instrument params: " << dump(params) << std::endl;
        std::cout << "[DLL] result: instrument " << get(params, "ip", "127.0.0.1")
                  << " connected, timeout_ms=" << get(params, "timeout_ms", "0") << std::endl;
        return 0;
    }

    unsigned int set_band(ParamMap params) {
        std::cout << "[DLL] set_band params: " << dump(params) << std::endl;
        std::cout << "[DLL] result: band=" << get(params, "band", "2.4G")
                  << " reset=" << get(params, "reset", "false") << std::endl;
        return 0;
    }

    unsigned int get_input_params(ParamMap params) {
        std::cout << "[DLL] get_input_params params: " << dump(params) << std::endl;
        std::cout << "[DLL] result: mode=" << get(params, "mode", "1") << " ready" << std::endl;
        return 0;
    }

    unsigned int check_test_flag(ParamMap params) {
        std::cout << "[DLL] check_test_flag params: " << dump(params) << std::endl;
        std::cout << "[DLL] result: flag test_info=" << get(params, "test_info", "0")
                  << " mode=" << get(params, "mode", "-") << " PASS" << std::endl;
        return 0;
    }

    unsigned int measure_tx_power(ParamMap params) {
        std::cout << "[DLL] measure_tx_power params: " << dump(params) << std::endl;
        std::cout << "[DLL] result: channel=" << get(params, "channel", "-")
                  << " power=18.2 dBm target=" << get(params, "target_dbm", "18.5")
                  << " PASS" << std::endl;
        return 0;
    }

    unsigned int measure_evm(ParamMap params) {
        std::cout << "[DLL] measure_evm params: " << dump(params) << std::endl;
        std::cout << "[DLL] result: channel=" << get(params, "channel", "-")
                  << " rate=" << get(params, "rate", "MCS7")
                  << " evm=-28.4 dB limit=" << get(params, "limit_db", "-28")
                  << " PASS" << std::endl;
        return 0;
    }

    unsigned int measure_rx_sensitivity(ParamMap params) {
        std::cout << "[DLL] measure_rx_sensitivity params: " << dump(params) << std::endl;
        std::cout << "[DLL] result: channel=" << get(params, "channel", "6")
                  << " packets=" << get(params, "packet_count", "1000")
                  << " sensitivity=-92 dBm PASS" << std::endl;
        return 0;
    }

    unsigned int close_dut_port(ParamMap params) {
        std::cout << "[DLL] close_dut_port params: " << dump(params) << std::endl;
        std::cout << "[DLL] result: DUT port closed" << std::endl;
        return 0;
    }

    static const std::map<std::string, MemberFn>& registry() {
        static const std::map<std::string, MemberFn> handlers = {
            {"open_dut_port", &WifiTestDll::open_dut_port},
            {"connect_instrument", &WifiTestDll::connect_instrument},
            {"set_band", &WifiTestDll::set_band},
            {"get_input_params", &WifiTestDll::get_input_params},
            {"check_test_flag", &WifiTestDll::check_test_flag},
            {"measure_tx_power", &WifiTestDll::measure_tx_power},
            {"measure_evm", &WifiTestDll::measure_evm},
            {"measure_rx_sensitivity", &WifiTestDll::measure_rx_sensitivity},
            {"close_dut_port", &WifiTestDll::close_dut_port},
        };
        return handlers;
    }
};

extern "C" void* wifi_test_create() {
    return new WifiTestDll();
}

extern "C" void wifi_test_destroy(void* obj) {
    delete static_cast<WifiTestDll*>(obj);
}

extern "C" unsigned int wifi_test_call(void* obj, const char* name, ParamMap params) {
    auto* impl = static_cast<WifiTestDll*>(obj);
    const auto& handlers = WifiTestDll::registry();
    const auto it = handlers.find(name == nullptr ? "" : name);
    if (!impl || it == handlers.end()) {
        std::cerr << "[DLL] function not found: " << (name == nullptr ? "(null)" : name) << std::endl;
        return 1;
    }
    return (impl->*it->second)(params);
}

extern "C" unsigned int wifi_test_count() {
    return static_cast<unsigned int>(WifiTestDll::registry().size());
}
