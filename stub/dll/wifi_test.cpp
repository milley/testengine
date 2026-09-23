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

extern "C" void open_dut_port(ParamMap params) {
    std::cout << "[DLL] open_dut_port params: " << dump(params) << std::endl;
    std::cout << "[DLL] result: DUT port " << get(params, "port", "?")
              << " opened (" << get(params, "port_desc", "port") << ")" << std::endl;
}

extern "C" void connect_instrument(ParamMap params) {
    std::cout << "[DLL] connect_instrument params: " << dump(params) << std::endl;
    std::cout << "[DLL] result: instrument " << get(params, "ip", "127.0.0.1")
              << " connected, timeout_ms=" << get(params, "timeout_ms", "0") << std::endl;
}

extern "C" void set_band(ParamMap params) {
    std::cout << "[DLL] set_band params: " << dump(params) << std::endl;
    std::cout << "[DLL] result: band=" << get(params, "band", "2.4G")
              << " reset=" << get(params, "reset", "false") << std::endl;
}

extern "C" void get_input_params(ParamMap params) {
    std::cout << "[DLL] get_input_params params: " << dump(params) << std::endl;
    std::cout << "[DLL] result: mode=" << get(params, "mode", "1") << " ready" << std::endl;
}

extern "C" void check_test_flag(ParamMap params) {
    std::cout << "[DLL] check_test_flag params: " << dump(params) << std::endl;
    std::cout << "[DLL] result: flag test_info=" << get(params, "test_info", "0")
              << " mode=" << get(params, "mode", "-") << " PASS" << std::endl;
}

extern "C" void measure_tx_power(ParamMap params) {
    std::cout << "[DLL] measure_tx_power params: " << dump(params) << std::endl;
    std::cout << "[DLL] result: channel=" << get(params, "channel", "-")
              << " power=18.2 dBm target=" << get(params, "target_dbm", "18.5")
              << " PASS" << std::endl;
}

extern "C" void measure_evm(ParamMap params) {
    std::cout << "[DLL] measure_evm params: " << dump(params) << std::endl;
    std::cout << "[DLL] result: channel=" << get(params, "channel", "-")
              << " rate=" << get(params, "rate", "MCS7")
              << " evm=-28.4 dB limit=" << get(params, "limit_db", "-28")
              << " PASS" << std::endl;
}

extern "C" void measure_rx_sensitivity(ParamMap params) {
    std::cout << "[DLL] measure_rx_sensitivity params: " << dump(params) << std::endl;
    std::cout << "[DLL] result: channel=" << get(params, "channel", "6")
              << " packets=" << get(params, "packet_count", "1000")
              << " sensitivity=-92 dBm PASS" << std::endl;
}

extern "C" void close_dut_port(ParamMap params) {
    std::cout << "[DLL] close_dut_port params: " << dump(params) << std::endl;
    std::cout << "[DLL] result: DUT port closed" << std::endl;
}
