const XLSX = require("xlsx-style");
const XLSX1 = require('xlsx')
/*
let filename = '../masterFile.xlsx'
let workbook = XLSX.readFile(filename, {'cellStyles':true});
let sheet = workbook.Sheets[workbook.SheetNames[workbook.SheetNames.indexOf('MasterFile')]]
let j = XLSX.utils.sheet_to_json(sheet)
var range = XLSX.utils.decode_range(sheet['!ref']);
var result = [];
var row;
var rowNum;
var colNum;
for(rowNum = range.s.r; rowNum <= range.e.r; rowNum++){
    row = [];
    for(colNum=range.s.c; colNum<=range.e.c; colNum++){
        var nextCell = sheet[
            XLSX.utils.encode_cell({r: rowNum, c: colNum})
        ];
        if( typeof nextCell === 'undefined' ){
            row.push(void 0);
        } else row.push(nextCell.s);
    }
    result.push(row);
}
console.log(result[0])*/


function sheet2Styles(sheet){
    var range = XLSX.utils.decode_range(sheet['!ref']);
    var result = [];
    var row;
    var rowNum;
    var colNum;
    for(rowNum = range.s.r; rowNum <= range.e.r; rowNum++){
        row = [];
        for(colNum=range.s.c; colNum<=range.e.c; colNum++){
            var nextCell = sheet[
                XLSX.utils.encode_cell({r: rowNum, c: colNum})
            ];
            
            if( typeof nextCell === 'undefined' ){
                //sheet[XLSX.utils.encode_cell({r: rowNum, c: colNum})] = { v: "", t: "s"}
                console.log(XLSX.utils.encode_cell({r: rowNum, c: colNum}))
                row.push({});
            } else row.push(nextCell.s);
        }
        result.push(row);
    }
    console.log(sheet['!cols'])
    console.log(JSON.stringify(result[0][0]))
    return result
}

let workbookStyle = XLSX.readFile('../masterFile.xlsx', {'cellStyles':true, 'sheetStubs':true});
let sheetStyle = workbookStyle.Sheets[workbookStyle.SheetNames[workbookStyle.SheetNames.indexOf('MasterFile')]]
let styles = sheet2Styles(sheetStyle)
// STEP 1: Create a new workbook
const wb = XLSX1.utils.book_new();

// STEP 2: Create data rows and styles
let row = [
	{ v: "Courier: 24", t: "s", s: {"numFmt":"General","font":{"bold":true,"sz":"11","color":{"theme":"1","rgb":"FFFFFF"},"name":"Calibri"},"border":{"left":{"style":"thin","color":{}},"right":{"style":"thin","color":{}},"bottom":{"style":"thin","color":{}}},"alignment":{"vertical":"center","horizontal":"left","wrapText":"1"}} },
	{ v: "bold & color", t: "s", s: { font: { bold: true, color: { rgb: "FF0000" } } } },
	{ v: "fill: color", t: "s", s: { fill: { fgColor: { rgb: "E9E9E9" } } } },
	{ v: "line\nbreak", t: "s", s: { alignment: { wrapText: true } } },
];

// STEP 3: Create worksheet with rows; Add worksheet to workbook
const ws = XLSX1.utils.aoa_to_sheet([row]);
XLSX1.utils.book_append_sheet(wb, ws, "readme demo");

// STEP 4: Write Excel file to browser
XLSX1.writeFile(wb, "xlsx-style-demo.xlsx");