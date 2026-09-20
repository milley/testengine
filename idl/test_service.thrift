namespace cpp testengine
namespace js testengine

struct RunResult {
  1: string status,
  2: string error,
  3: list<string> logs
}

service TestService {
  RunResult runTree(1: string treeId, 2: string treeJson)
  void stopTree()
  RunResult getStatus()
  list<string> getLog()
}

service StubService {
  void callFunction(1: string dllPath, 2: string functionName, 3: map<string, string> params)
  void reloadDll(1: string dllPath)
}
