#include <algorithm>
#include <array>
#include <chrono>
#include <cstdio>
#include <ctime>
#include <string>
#include <string_view>
#include <utility>

#include "llvm/Support/JSON.h"
#include "llvm/Support/raw_ostream.h"

using namespace llvm;

static constexpr std::array<std::string_view, 9> kEventKinds = {
    "OBSERVATION", "TESTED", "VERIFIED", "CONTRADICTION", "INTERPRETATION",
    "BOUNDARY", "REVISED", "PROMOTED", "REOPENED"};

static bool validKind(std::string_view kind) {
  return std::find(kEventKinds.begin(), kEventKinds.end(), kind) != kEventKinds.end();
}

static std::string isoUtcNow() {
  using namespace std::chrono;
  const auto now = system_clock::now();
  const auto wholeSeconds = time_point_cast<seconds>(now);
  const auto millis = duration_cast<milliseconds>(now - wholeSeconds).count();
  const std::time_t stamp = system_clock::to_time_t(now);
  std::tm utc{};
#ifdef _WIN32
  gmtime_s(&utc, &stamp);
#else
  gmtime_r(&stamp, &utc);
#endif
  char date[24]{};
  std::strftime(date, sizeof(date), "%Y-%m-%dT%H:%M:%S", &utc);
  char out[32]{};
  std::snprintf(out, sizeof(out), "%s.%03lldZ", date,
                static_cast<long long>(millis));
  return out;
}

int main(int argc, char **argv) {
  const std::string kind = argc > 1 ? argv[1] : "OBSERVATION";
  const std::string project = argc > 2 ? argv[2] : "llvm-bridge";
  const std::string message = argc > 3 ? argv[3] : "LLVM analytics event";
  const std::string evidence = argc > 4 ? argv[4] : "unspecified";

  if (!validKind(kind)) {
    errs() << "invalid analytics event kind: " << kind << "\n";
    return 2;
  }

  json::Object event{
      {"time", isoUtcNow()},
      {"kind", kind},
      {"project", project},
      {"message", message},
      {"evidence", evidence},
      {"source", "llvm-event-bridge"},
      {"status", "recorded"},
  };

  outs() << formatv("{0}\n", json::Value(std::move(event)));
  return 0;
}
