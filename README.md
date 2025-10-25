# 🎭 AI-Powered Playwright BDD Framework
 
A comprehensive test automation framework combining **Playwright** + **Cucumber BDD** with intelligent AI features for enterprise-grade testing.

**🏗️ Architecture**
- **Features:** Gherkin scenarios in features/*.feature
- **Steps:** Implementation in step_definitions/*.step.js
- **Data:** Excel-driven test data in data.xlsx
- **Pages:** Page object pattern in pageobjects
- **Config:** RunManager.xlsx controls test execution
- **AI Assistant:** GitHub Copilot integration for intelligent test development
 
## ✨ Key Features
 
- 🤖 **AI-Powered**: 
  - GitHub Copilot integration for intelligent test generation and code assistance
  - Self-healing selectors with automatic element recovery
  - Intelligent test synchronization and scenario management
- 📊 **Excel Integration**: Data-driven testing with automatic scenario sync
- 🌐 **Multi-Language**: Support for Japanese localization and international testing
- 📸 **Visual Testing**: Screenshot comparison and visual regression detection
- 📋 **BDD Approach**: Gherkin-based scenarios for business-readable tests
- 🗄️ **Database Automation**: MySQL integration for data validation and database testing
- 🔌 **API Automation**: RESTful API testing with request/response validation
- 📧 **Email Automation**: Email testing capabilities for notification and communication workflows
- 📈 **Rich Reporting**: Allure integration with detailed test analytics
- 🔄 **Smart Execution**: RunManager-controlled test selection and execution
- 🛡️ **Enterprise Ready**: Proxy support, environment configuration, security features
- 🎯 **Unified Framework**: Single framework supporting UI, API, Database, and Email testing scenarios

## 🚀 Quick Start
```bash
npm run test  # Sync RunManager → Execute tests → Generate Allure report

