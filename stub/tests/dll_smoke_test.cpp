#include <cstdlib>
#include <iostream>
#include <string>

static int failures = 0;

static void expectContains(const std::string& output, const std::string& needle) {
    if (output.find(needle) != std::string::npos) {
        std::cout << "ok contains " << needle << std::endl;
        return;
    }
    std::cerr << "FAIL missing [" << needle << "] in:\n" << output << std::endl;
    failures += 1;
}

static std::string capture(const std::string& command, bool allowFailure = false) {
    std::string output;
    FILE* pipe = popen(command.c_str(), "r");
    if (!pipe) return output;
    char buffer[256];
    while (fgets(buffer, sizeof(buffer), pipe)) output += buffer;
    int status = pclose(pipe);
    if (!allowFailure && status != 0) {
        std::cerr << "FAIL command exited " << status << ": " << command << std::endl;
        failures += 1;
    }
    return output;
}

int main(int argc, char** argv) {
    if (argc < 3) {
        std::cerr << "usage: dll_smoke_test <dll_call> <wifi_test.dll>" << std::endl;
        return 2;
    }
    const std::string caller = argv[1];
    const std::string dll = argv[2];

    auto missing = capture(caller + " 2>&1", true);
    expectContains(missing, "usage:");

    auto open = capture(caller + " \"" + dll + "\" open_dut_port \"port=10;sleep_ms=200;port_desc=diag port\" 2>&1");
    expectContains(open, "open_dut_port params:");
    expectContains(open, "port=10");
    expectContains(open, "DUT port 10 opened");
    expectContains(open, "return code: 0");

    auto tx = capture(caller + " \"" + dll + "\" measure_tx_power \"channel=6;target_dbm=18.5\" 2>&1");
    expectContains(tx, "power=18.2 dBm");
    expectContains(tx, "PASS");

    auto close = capture(caller + " \"" + dll + "\" close_dut_port 2>&1");
    expectContains(close, "DUT port closed");

    auto bad = capture(caller + " \"" + dll + "\" not_a_function 2>&1", true);
    expectContains(bad, "function not found");

    if (failures != 0) {
        std::cerr << failures << " dll assertion(s) failed" << std::endl;
        return 1;
    }
    std::cout << "dll smoke tests passed" << std::endl;
    return 0;
}
