#include "param_parser.h"

#include <cstdlib>
#include <iostream>
#include <string>

static int failures = 0;

static void expect(bool ok, const std::string& message) {
    if (ok) {
        std::cout << "ok " << message << std::endl;
        return;
    }
    std::cerr << "FAIL " << message << std::endl;
    failures += 1;
}

int main() {
    auto params = parseParams("port=10;sleep_ms=200;port_desc=diag port");
    expect(params.size() == 3, "parses three pairs");
    expect(params["port"] == "10", "keeps port");
    expect(params["port_desc"] == "diag port", "keeps spaces in values");

    auto empty = parseParams("");
    expect(empty.empty(), "empty string yields no params");

    auto skipped = parseParams(";band=2.4G;;reset=true;");
    expect(skipped.size() == 2, "skips empty segments");
    expect(skipped["band"] == "2.4G", "keeps dotted values");

    auto bare = parseParams("flag");
    expect(bare["flag"] == "", "missing value becomes empty");

    auto equals = parseParams("expr=a=b");
    expect(equals["expr"] == "a=b", "splits only on the first equals");

    if (failures != 0) {
        std::cerr << failures << " assertion(s) failed" << std::endl;
        return 1;
    }
    std::cout << "param parser tests passed" << std::endl;
    return 0;
}
