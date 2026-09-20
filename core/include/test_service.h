#ifndef TEST_SERVICE_H
#define TEST_SERVICE_H

#include <map>
#include <string>
#include <vector>

struct RunResult {
    std::string status;
    std::string error;
    std::vector<std::string> logs;
};

class TestService {
public:
    virtual ~TestService() = default;
    virtual bool runTree(const std::string& treeId, const std::string& treeJson, RunResult& result) = 0;
    virtual bool stopTree(RunResult& result) = 0;
    virtual bool getStatus(RunResult& result) = 0;
    virtual bool getLog(std::vector<std::string>& logs) = 0;
};

#endif
