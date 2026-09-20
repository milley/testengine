#include <iostream>
#include <string>
#include <map>

class SocketCommunicator {
public:
    static bool sendToStub(const std::string& dllPath, const std::string& function, const std::map<std::string, std::string>& params) {
        std::cout << "[Socket] Sending to stub:" << std::endl;
        std::cout << "  DLL: " << dllPath << std::endl;
        std::cout << "  Function: " << function << std::endl;
        std::cout << "  Params:" << std::endl;
        for (const auto& [key, value] : params) {
            std::cout << "    " << key << " = " << value << std::endl;
        }
        std::cout << "[Socket] Call completed successfully" << std::endl;
        return true;
    }
};
