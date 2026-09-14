cmake_minimum_required(VERSION 3.20)
project(conscience64_analytics_bridge LANGUAGES CXX)

find_package(LLVM REQUIRED CONFIG)
message(STATUS "Found LLVM ${LLVM_PACKAGE_VERSION}")

add_definitions(${LLVM_DEFINITIONS})
add_executable(llvm_event_bridge llvm_event_bridge.cpp)
target_compile_features(llvm_event_bridge PRIVATE cxx_std_17)
target_include_directories(llvm_event_bridge PRIVATE ${LLVM_INCLUDE_DIRS})

llvm_map_components_to_libnames(LLVM_LIBS Support)
target_link_libraries(llvm_event_bridge PRIVATE ${LLVM_LIBS})
