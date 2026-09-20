cmake_minimum_required(VERSION 3.10)
project(TestStub)

set(CMAKE_CXX_STANDARD 17)

add_executable(stub
    main.cpp
)

target_link_libraries(stub pthread dl)
