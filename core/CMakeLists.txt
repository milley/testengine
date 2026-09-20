cmake_minimum_required(VERSION 3.10)
project(TestEngineCore)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(${CMAKE_SOURCE_DIR}/include)

add_executable(thrift_server
    src/thrift_server.cpp
    src/dll_loader.cpp
    src/socket_communicator.cpp
)

target_link_libraries(thrift_server dl)

install(TARGETS thrift_server DESTINATION bin)
