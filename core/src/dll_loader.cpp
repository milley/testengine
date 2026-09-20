#include <iostream>
#include <string>
#include <map>
#include <dlfcn.h>

class DLLLoader {
public:
    static void* load(const std::string& dllPath) {
        void* handle = dlopen(dllPath.c_str(), RTLD_LAZY);
        if (!handle) {
            std::cerr << "Failed to load DLL: " << dlerror() << std::endl;
        } else {
            std::cout << "✅ DLL loaded: " << dllPath << std::endl;
        }
        return handle;
    }

    static void unload(void* handle) {
        if (handle) {
            dlclose(handle);
            std::cout << "✅ DLL unloaded" << std::endl;
        }
    }

    static void* getFunction(void* handle, const std::string& funcName) {
        if (!handle) return nullptr;
        return dlsym(handle, funcName.c_str());
    }
};
