#pragma once

#include <map>
#include <string>

// wifi_test.dll 对外接口（对象方式）：先创建对象，再按函数名调用其成员函数，用完销毁。
// 返回值：0 = PASS，非 0 = 失败或函数未登记。
extern "C" {
void* wifi_test_create();
unsigned int wifi_test_call(void* obj, const char* name,
                            const std::map<std::string, std::string>& params);
unsigned int wifi_test_count();
void wifi_test_destroy(void* obj);
}
