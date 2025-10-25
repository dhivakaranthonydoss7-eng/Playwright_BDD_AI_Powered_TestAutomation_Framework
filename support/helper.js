const ExcelJS = require('exceljs');
const fs = require('fs');
let filename = './datatables/excel/data.xlsx';
let output_file = './datatables/excel/Output.xlsx';
let workbook = '';
var datatable = () => {
  workbook = new ExcelJS.Workbook();
  workbook.xlsx.readFile(filename, {
    ignoreNodes: [
      'dataValidations', // ignores the workbook's Data Validations
    ],
  });
};
class Helper {
  //***** Get the data from data.xlsx *****
  async getData(sheetName, tcid, columnName) {
    let columnData, colNum;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filename, {
      ignoreNodes: [
        'dataValidations', // ignores the workbook's Data Validations
      ],
    });

    let worksheet = workbook.getWorksheet(sheetName);
    let rows = worksheet.rowCount;

    for (let i = 1; i <= worksheet.columnCount; i++) {
      if (worksheet.getRow(2).getCell(i).value === columnName) {
        colNum = i;
        break;
      }
    }
    for (let i = 4; i <= rows; i++) {
      if (worksheet.getRow(i).getCell(2).value === tcid) {
        columnData = worksheet.getRow(i).getCell(colNum).value;
        break;
      }
    }
    return columnData;
  }

  //***** Store the data in the data.xlsx *****
  async putData(sheetName, tcid, columnName, testerData) {
    var columnData, colNum;
    const testsetData = testerData;

    //***** Store the data in the expected cell based on the sheetname, column name and row *****
    var worksheet = workbook.getWorksheet(sheetName);
    var rows = worksheet.rowCount;
    for (var i = 1; i <= worksheet.columnCount; i++) {
      if (worksheet.getRow(1).getCell(i).value == columnName) {
        colNum = i;
        console.log(`Column Number ${colNum}`);
        break;
      }
    }
    for (var j = 2; j <= rows; j++) {
      if (worksheet.getRow(j).getCell(2).value == tcid) {
        worksheet.getRow(j).getCell(colNum).value = testsetData;
        await workbook.xlsx.writeFile(filename, {
          ignoreNodes: [
            'dataValidations', // ignores the workbook's Data Validations
          ],
        });
        break;
      }
    }
    return columnData;
  }

  //***** Get the data from RunManager.xlsx to execute the test cases *****
  async getRunManager(sheetName) {
    let content = '';
    let allure_folder = '';
    let allure_results = '';
    var filename = './RunManager.xlsx';
    const workbook = new ExcelJS.Workbook();
    var colNum;

    //***** Run the test cases based on the cell value is 'Yes' *****
    await workbook.xlsx.readFile(filename);
    var worksheet = workbook.getWorksheet(sheetName);
    var rows = worksheet.rowCount;

    for (var i = 1; i <= worksheet.columnCount; i++) {
      if (worksheet.getRow(1).getCell(i).value == 'Execute') {
        colNum = i;
        break;
      }
    }
    for (var k = 2, j = 0; k <= rows; k++, j++) {
      var row = worksheet.getRow(k);
      var cell = row.getCell(colNum);
      if (row == null || cell == null) {
        continue;
      } else if (cell.value == null) {
        content.default.paths[j] = '';
        fs.writeFileSync('cucumber.json', JSON.stringify(content));
      } else if (worksheet.getRow(k).getCell(colNum).value == 'Yes') {
        content = JSON.parse(fs.readFileSync('cucumber.json', 'utf8'));
        content.default.paths[j] = '';
        content.default.paths[j] = worksheet.getRow(k).getCell(3).value;
        fs.writeFileSync('cucumber.json', JSON.stringify(content));
      } else if (worksheet.getRow(k).getCell(colNum).value == 'No') {
        content = JSON.parse(fs.readFileSync('cucumber.json', 'utf8'));
        content.default.paths[j] = '';
        fs.writeFileSync('cucumber.json', JSON.stringify(content));
      }
    }

    //***** Store the allure results in constants.json and package.json files for each executions *****
    allure_folder = JSON.parse(fs.readFileSync('./datatables/json/constants.json', 'utf-8'));
    let currentdate = new Date();
    let datetime =
      currentdate.getDate() +
      '_' +
      (currentdate.getMonth() + 1) +
      '_' +
      currentdate.getFullYear() +
      '_' +
      currentdate.getHours() +
      '_' +
      currentdate.getMinutes() +
      '_' +
      currentdate.getSeconds();
    allure_folder.allure = '';
    allure_folder.allure = datetime;
    fs.writeFileSync('./datatables/json/constants.json', JSON.stringify(allure_folder));
    allure_results = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    allure_results.scripts.report = '';
    allure_results.scripts.report = `allure serve allure-results/${datetime}`;
    fs.writeFileSync('package.json', JSON.stringify(allure_results));
    let report_loc = 'html:reports/' + datetime + '/Execution-Report.html';
    let json_report_loc = 'json:reports/' + datetime + '/Execution-Report.json';
    console.log(`Report Location is ${report_loc}`);
    content = JSON.parse(fs.readFileSync('cucumber.json', 'utf8'));
    content.default.format[0] = '';
    content.default.format[0] = report_loc;
    content.default.format[1] = '';
    content.default.format[1] = json_report_loc;
    fs.writeFileSync('cucumber.json', JSON.stringify(content));
  }

  //***** Store the data in the outPut.xlsx *****
  async putData_Output(sheetName, tcid, columnName, data) {
    let columnData, colNum;
    const output = new ExcelJS.Workbook();
    await output.xlsx.readFile(output_file, {
      ignoreNodes: [
        'dataValidations', // ignores the workbook's Data Validations
      ],
    });

    //***** Store the data in the expected cell based on the sheetname, column name and row *****
    let worksheet = output.getWorksheet(sheetName);
    let rows = worksheet.rowCount;

    for (let i = 1; i <= worksheet.columnCount; i++) {
      if (worksheet.getRow(1).getCell(i).value === columnName) {
        colNum = i;
        break;
      }
    }
    for (let i = 2; i <= rows; i++) {
      if (worksheet.getRow(i).getCell(2).value === tcid) {
        worksheet.getRow(i).getCell(colNum).value = data;
        await output.xlsx.writeFile(output_file, {
          ignoreNodes: [
            'dataValidations', // ignores the workbook's Data Validations
          ],
        });
        break;
      }
    }
    return columnData;
  }

  //***** Get the data from outPut.xlsx *****
  async getDataOutput(sheetName, tcid, columnName) {
    let columnData, colNum;

    const output = new ExcelJS.Workbook();
    await output.xlsx.readFile(output_file, {
      ignoreNodes: [
        'dataValidations', // ignores the workbook's Data Validations
      ],
    });

    let worksheet = output.getWorksheet(sheetName);
    let rows = worksheet.rowCount;

    //***** Fetch the expected data from the cell based on the sheetname, column name and row *****
    for (let i = 1; i <= worksheet.columnCount; i++) {
      if (worksheet.getRow(1).getCell(i).value === columnName) {
        colNum = i;
        break;
      }
    }
    for (let i = 2; i <= rows; i++) {
      if (worksheet.getRow(i).getCell(2).value === tcid) {
        columnData = worksheet.getRow(i).getCell(colNum).value;
        break;
      }
    }
    return columnData;
  }
}
module.exports = {Helper, datatable};
