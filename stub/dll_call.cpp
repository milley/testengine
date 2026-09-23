#include <dlfcn.h>
#include <iostream>
#include <map>
#include <sstream>
#include <string>

using TestFunction = void (*)(const std::map<std::string, std::string>&);

static std::map<std::string, std::string> parse(const std::string& raw) {
    std::map<std::string, std::string> params;
    std::stringstream stream(raw);
    std::string item;
    while (std::getline(stream, item, ';')) {
        if (item.empty()) continue;
        auto pos = item.find('=');
        if (pos == std::string::npos) {
            params[item] = "";
        } else {
            params[item.substr(0, pos)] = item.substr(pos + 1);
        }
    }
    return params;
}

int main(int argc, char** argv) {
    if (argc < 3) {
        std::cerr << "usage: dll_call <dll> <function> [key=value;key=value]" << std::endl;
        return 2;
    }

    const char* dll = argv[1];
    const char* name = argv[2];
    auto params = argc > 3 ? parse(argv[3]) : std::map<std::string, std::string>{};

    void* handle = dlopen(dll, RTLD_LAZY);
    if (!handle) {
        std::cerr << "dlopen failed: " << dlerror() << std::endl;
        return 1;
    }

    auto func = reinterpret_cast<TestFunction>(dlsym(handle, name));
    if (!func) {
        std::cerr << "dlsym failed: " << name << " " << dlerror() << std::endl;
        dlclose(handle);
        return 1;
    }

    func(params);
    dlclose(handle);
    return 0;
}
