#include <iostream>
#include <cstdlib>
#include <string>

int main() {
    std::cout << "🚀 RBC InvestEase & InvestIQ Platform Launcher" << std::endl;
    std::cout << "Starting all services..." << std::endl;

    // Execute the batch file
    int result = system("start-all.bat");

    if (result == 0) {
        std::cout << "✅ Services started successfully!" << std::endl;
    } else {
        std::cout << "❌ Error starting services. Please check the batch file." << std::endl;
    }

    return result;
}