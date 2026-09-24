#include "dll/wifi_test.h"
#include "param_parser.h"

#include <dlfcn.h>
#include <iostream>
#include <map>
#include <string>

using CreateFn = void* (*)();
using CallFn = unsigned int (*)(void*, const char*, const std::map<std::string, std::string>&);
using DestroyFn = void (*)(void*);

int main(int argc, char** argv) {
    if (argc < 3) {
        std::cerr << "usage: dll_call <dll> <function> [key=value;key=value]" << std::endl;
        return 2;
    }

    const char* dll = argv[1];
    const char* name = argv[2];
    auto params = argc > 3 ? parseParams(argv[3]) : std::map<std::string, std::string>{};

    void* handle = dlopen(dll, RTLD_LAZY);
    if (!handle) {
        std::cerr << "dlopen failed: " << dlerror() << std::endl;
        return 1;
    }

    auto create = reinterpret_cast<CreateFn>(dlsym(handle, "wifi_test_create"));
    auto call = reinterpret_cast<CallFn>(dlsym(handle, "wifi_test_call"));
    auto destroy = reinterpret_cast<DestroyFn>(dlsym(handle, "wifi_test_destroy"));
    if (!create || !call || !destroy) {
        std::cerr << "dlsym failed: " << dlerror() << std::endl;
        dlclose(handle);
        return 1;
    }

    void* obj = create();
    const unsigned int code = call(obj, name, params);
    std::cout << "[DLL] return code: " << code << std::endl;
    destroy(obj);
    dlclose(handle);

    if (code != 0) {
        std::cerr << "function returned error code: " << code << std::endl;
        return 1;
    }
    return 0;
}
