cmake_minimum_required(VERSION 3.10)
project(TestStub)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(wifi_test SHARED dll/wifi_test.cpp)
set_target_properties(wifi_test PROPERTIES
    PREFIX ""
    OUTPUT_NAME "wifi_test"
    SUFFIX ".dll"
    LIBRARY_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/dll"
)

add_executable(stub main.cpp)
target_link_libraries(stub PRIVATE ${CMAKE_DL_LIBS})

add_executable(dll_call dll_call.cpp)
target_link_libraries(dll_call PRIVATE ${CMAKE_DL_LIBS})
