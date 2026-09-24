#pragma once

#include <map>
#include <sstream>
#include <string>

inline std::map<std::string, std::string> parseParams(const std::string& raw) {
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
