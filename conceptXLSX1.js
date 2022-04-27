const XLSX = require("xlsx");
const fs = require('fs');
const XLSXStyle = require("xlsx-style");



//See if actions works on forks
//const fs = require('fs');
const readline = require('readline')
let conceptIdVariants = ["@id","conceptId"];
let jsonList = [];

function getConceptIdIndex (header){
    for(let j = 0; j < conceptIdVariants.length; j++){
        let index = header.indexOf(conceptIdVariants[j])
        if(index != -1){
            return index;
        }
    }
    return -1;
}

function generateNine(){
    let a = ''
    a += Math.floor(Math.random()*9 + 1)
    for(let i = 1; i < 9; i++){
        let b = Math.floor(Math.random()*10)
        a += b
    }
    return a;
}

function generateRandomUUID(conceptIdList){
    //return uuidv4();
    let num = generateNine()
    while(!conceptIdList.includes(num)){
        let num = generateNine();
        return num;
    }
}

function replaceQuotes(text){
    //text = text.replace(/\"\"+/g,'\"\"')
    return text;
}

function processCluster(cluster, header, nameToConcept, indexVariableName, conceptIdList, conceptIdObject, sourceJSONS, jsonList, regexInclude){
    //console.log(cluster[0])
    let nonEmpty = [];
    let conceptIdObjectKeys =Object.keys(conceptIdObject)
    let conceptIdIndices = [];
    let generalId = -1;
    let conceptIdReverseLookup = {};
    for(let i = 0; i < conceptIdObjectKeys.length; i++){
        conceptIdIndices.push(parseInt(conceptIdObjectKeys[i]))
        conceptIdReverseLookup[conceptIdObject[conceptIdObjectKeys[i]]] = parseInt(conceptIdObjectKeys[i])
    }

    for(let i = 1; i < cluster.length; i++){
        let currArr = cluster[i]
        for(let j = 0; j < currArr.length; j++){
            if(currArr[j].trim()!='' && !conceptIdIndices.includes(j)){
                if(!nonEmpty.includes(j)){
                    nonEmpty.push(j)
                }
            }
        }
    }
    let firstRowJSON = {}
    let firstRow = cluster[0]
    let clump = [];
    for(let i = 0; i < firstRow.length; i++){
        if((firstRow[i] != "" && !nonEmpty.includes(i) && !conceptIdIndices.includes(i)) || (conceptIdIndices.includes(i) && conceptIdObject[i] =="Question Text")){
            firstRowJSON[header[i]] = firstRow[i]
        }
    }

    //Creating concept Id for the cluster
    if(!firstRowJSON.hasOwnProperty('conceptId') || firstRowJSON['conceptId'] == ''){
        if(nameToConcept.hasOwnProperty(firstRow[indexVariableName])){
            firstRowJSON['conceptId'] = nameToConcept[firstRow[indexVariableName]]
            if(!conceptIdList.includes(firstRowJSON['conceptId'])){
                conceptIdList.push(firstRowJSON['conceptId'])
            }
            
        }
        else{
             firstRowJSON['conceptId'] = generateRandomUUID(conceptIdList);
             conceptIdList.push(firstRowJSON['conceptId'])
             nameToConcept[firstRow[indexVariableName]] = firstRowJSON['conceptId']
        }
    }

    firstRow[conceptIdReverseLookup['Question Text']] = firstRowJSON['conceptId']

    //find sources first
    let conceptColNames = Object.keys(conceptIdReverseLookup)
    for(let i = 0; i < conceptColNames.length; i++){
        if(conceptColNames[i].indexOf('Source') != -1 && firstRow[conceptIdReverseLookup[conceptColNames[i]] + 1] != ''){

            for(let k = 0; k < cluster.length; k++){
                if(cluster[k][conceptIdReverseLookup[conceptColNames[i]] + 1] != ""){
                    let currId = cluster[k][conceptIdReverseLookup[conceptColNames[i]]];
                    let currVarName = cluster[k][[conceptIdReverseLookup[conceptColNames[i]] + 1]]
                    if(currId == '' && nameToConcept.hasOwnProperty(currVarName)){
                        currId = nameToConcept[currVarName]
                        //console.log('abc: ' + currId)
                    }
                    //console.log(currId)
                    let found = -1;
                    //console.log(sourceJSONS.length)
                    for(let j = 0; j < sourceJSONS.length; j++){
                        let currJSON = sourceJSONS[j];
                        if(currId != '' && currJSON['conceptId'] == currId){
                            found = i;
                            if(!currJSON['subcollections'].includes(firstRowJSON['conceptId'] + '.json')){
                                currJSON['subcollections'].push(firstRowJSON['conceptId'] + '.json')
                            }
                            j = sourceJSONS.length;
                        }
                        else if(currId == '' && currVarName == currJSON['Question Text']){
                            found = i;
                            currId = currJSON['conceptId'];
                            if(!currJSON['subcollections'].includes(firstRowJSON['conceptId'] + '.json')){
                                currJSON['subcollections'].push(firstRowJSON['conceptId'] + '.json')
                            }
                            j = sourceJSONS.length
                        }
                    }
                    if(found == -1){
                        let newJSON = {}
                        if(currId == '' ){
                            currId = generateRandomUUID(conceptIdList);
                        }
                        
                        newJSON['conceptId'] = currId;
                        newJSON['Question Text'] = currVarName;
                        newJSON['subcollections'] = [firstRowJSON['conceptId'] + '.json']
                        sourceJSONS.push(newJSON)
                    }
                    nameToConcept[currVarName] = currId
                    if(!conceptIdList.includes(currId)){
                        conceptIdList.push(currId)
                    }
                
                    if(k > 0){
                        if(!Array.isArray(firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]])){
                            firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]] = [firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]]]
                            firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]].push(currId + '.json')
                        }
                        firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]].push(currId + '.json')
                    }
                    else{
                        firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]] = currId + '.json'
                    }
                    cluster[k][conceptIdReverseLookup[conceptColNames[i]]] = currId;
                }
            }
        }
    }

    let collections = [];
    let collectionIds = {};
    let leaves = []
    let leafIndex = -1;
    
    let debug = true;
    

    let arrays = {};
    
    for(let j = 0; j < nonEmpty.length; j++){
        let currIndex = nonEmpty[j]
        let nonEmptyIndex = currIndex;
        let currCol = [];
        let leafObj = {}
        for(let i = 0; i < cluster.length; i++){
            let currRow = cluster[i];
            // console.log(currRow)
            let currElement = currRow[currIndex].trim();
            if(currElement != ''){
                //Create conceptIds if this exists
                if(conceptIdObject[currIndex - 1]){
                    if(currElement.indexOf('=') != -1){
                        let val = currElement.split('=')[1].trim()
                        let key = currElement.split('=')[0].trim()
                        let cid = generateRandomUUID(conceptIdList)
                        if(nameToConcept.hasOwnProperty(val)){
                            cid = nameToConcept[val]
                        }
                        if(currRow[nonEmptyIndex - 1] != ''){
                            cid = currRow[nonEmptyIndex-1];
                        }
                        
                        let found = false;
                        for(let k = 0; k < jsonList.length; k++){
                            if(jsonList[k].hasOwnProperty('conceptId') && jsonList[k]['conceptId'] == cid){
                                found = true;
                            }
                        }
                        if(found == false){
                            jsonList.push({'conceptId':cid, 'Question Text':val})
                            fs.writeFileSync('./jsons/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Question Text':val},null, 2))
                            nameToConcept[val] = cid
                        }
                        if(!conceptIdList.includes(cid)){
                            conceptIdList.push(cid)
                        }
                        if(!leafObj[nonEmptyIndex]){
                            leafObj[nonEmptyIndex] = {}
                        }
                        leafObj[nonEmptyIndex][cid + '.json'] = key;
                        //leafObj[cid + '.json'] = key
                        currRow[nonEmptyIndex-1] = cid
                    }
                    
                    else{
                        let cid = generateRandomUUID(conceptIdList)
                        if(nameToConcept.hasOwnProperty(currElement)){
                            cid = nameToConcept[currElement]
                        }
                        if(currRow[nonEmptyIndex - 1] != ''){
                            cid = currRow[nonEmptyIndex-1];
                        }
                        
                        let found = false;
                        for(let k = 0; k < jsonList.length; k++){
                            if(jsonList[k].hasOwnProperty('conceptId') && jsonList[k]['conceptId'] == cid){
                                found = true;
                            }
                        }
                        if(found == false){
                            jsonList.push({'conceptId':cid, 'Question Text':currElement})
                            fs.writeFileSync('./jsons/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Question Text':currElement},null, 2))
                            nameToConcept[currElement] = cid
                        }
                        if(!conceptIdList.includes(cid)){
                            conceptIdList.push(cid)
                        }
                        currRow[nonEmptyIndex-1] = cid
                        currCol.push(cid + '.json')
                        
                    }
                }
                else{
                    currCol.push(currElement)
                }

            }
        }
        //console.log(firstRowJSON)
        //If they are in the 0=No form
        if(Object.keys(leafObj).length > 0){

            firstRowJSON[header[nonEmptyIndex]] = leafObj[nonEmptyIndex];
        }
        //If they do not have indices
        else{
            //Add the cols to the current json
            firstRowJSON[header[nonEmptyIndex]] = currCol;
        }

        //console.log(nonEmpty)
        //console.log('----------------------------------')
        
        
    }

    for(let i  = 0; i < Object.keys(conceptIdObject).length; i++){
        let key = parseInt(Object.keys(conceptIdObject)[i]) + 1
        let val = conceptIdObject[key-1]

        if(!(val.includes('Source') || val.includes('Src') || val.includes('Question Text') || val.includes('Connect Value for Select all that apply questions') || nonEmpty.includes(key) || !firstRow[key].match(regexInclude)) && firstRow[key] != ''){
            //console.log(val)
            //console.log(firstRow[key])
            
            let currVal = firstRow[key]
            let elementNumber = -1;
            let equalFound = false;
            if(currVal.indexOf('=') != -1){
                let currElement = currVal;
                currVal = currElement.split('=')[1].trim()
                elementNumber = currElement.split('=')[0].trim()
                equalFound = true;
            }
            let cid = generateRandomUUID(conceptIdList)
            if(nameToConcept.hasOwnProperty(currVal)){
                cid = nameToConcept[currVal]
            }
            if(firstRow[key - 1] != ''){
                cid = firstRow[key-1];
            }
            
            let found = false;
            for(let k = 0; k < jsonList.length; k++){
                if(jsonList[k].hasOwnProperty('conceptId') && jsonList[k]['conceptId'] == cid){
                    found = true;
                }
            }
            if(found == false){
                jsonList.push({'conceptId':cid, 'Question Text':currVal})
                fs.writeFileSync('./jsons/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Question Text':currVal},null, 2))
                nameToConcept[currVal] = cid
            }
            if(!conceptIdList.includes(cid)){
                conceptIdList.push(cid)
            }
            firstRow[key-1] = cid
            if(equalFound){
                firstRowJSON[val] = {};
                firstRowJSON[val][cid + '.json'] = elementNumber;
            }
            else{
                firstRowJSON[val] = cid + '.json';
            }
        }
    }

    if(cluster[0][conceptIdReverseLookup['Question Text']] == ''){

        firstRowJSON['conceptId'] = generateRandomUUID(conceptIdList);
        if(nameToConcept.hasOwnProperty(firstRowJSON[header[indexVariableName]])){
            firstRowJSON['conceptId'] = nameToConcept[firstRowJSON[header[indexVariableName]]];
        }
        cluster[0][conceptIdReverseLookup['Question Text']] = firstRowJSON['conceptId']
        nameToConcept[firstRowJSON[header[indexVariableName]]] = firstRowJSON['conceptId']
    }
    else{
        firstRowJSON['conceptId'] = cluster[0][conceptIdReverseLookup['Question Text']]
        nameToConcept[firstRowJSON[header[indexVariableName]]] = firstRowJSON['conceptId']
    }
    let firstRowJSONFound = findJSON(jsonList, firstRowJSON['Question Text']);
    if(firstRowJSONFound){
        //console.log(firstRowJSONFound)

        let keys = Object.keys(firstRowJSONFound);
        //console.log(firstRowJSONFound)
        //console.log(firstRowJSON)
        let foundSources = false
        let maxLength = -1;
        for(i in keys){
            let key = keys[i]
            if(key.includes('Source') || key.includes('Src') || key.includes('Variable Name') || key.includes('Connect Value for Select all that apply questions')){
                foundSources = true;
                let thisSource = firstRowJSONFound[key]
                if(firstRowJSON[key]){
                    if(Array.isArray(thisSource)){
                        thisSource.push(firstRowJSON[key])
                    }
                    else{
                        firstRowJSONFound[key] = [thisSource];
                        firstRowJSONFound[key].push(firstRowJSON[key])

                    }
                    maxLength = firstRowJSONFound[key].length;
                    
                }
                else{
                    if(Array.isArray(thisSource)){
                        thisSource.push('')
                    }
                    else{
                        firstRowJSONFound[key] = [thisSource];
                        firstRowJSONFound[key].push('')

                    }
                }
            }
        }
        let currKeys = Object.keys(firstRowJSON);
        for(i in currKeys){
            let key = currKeys[i];
            if(key.includes('Source') || key.includes('Src') || key.includes('Variable Name') || key.includes('Connect Value for Select all that apply questions')){
                if(!firstRowJSONFound[key]){
                    firstRowJSONFound[key] = [];
                    for(i = 0; i < maxLength-1; i++){
                        firstRowJSONFound[key].push('');
                    }
                    firstRowJSONFound[key].push(firstRowJSON[key]);

                }
            }
            else{
                if(!firstRowJSONFound[key]){
                    firstRowJSONFound[key] = firstRowJSON[key];
                }
            }
        }
        //console.log(firstRowJSONFound)
        //console.log(firstRowJSON)
        firstRowJSON = firstRowJSONFound
        //console.log(firstRowJSON)

    }
    else{
        let currKeys = Object.keys(firstRowJSON);
        for(i in currKeys){
            let key = currKeys[i];
            if(key.includes('Source') || key.includes('Src') || key.includes('Variable Name') || key.includes('Connect Value for Select all that apply questions')){
                firstRowJSON[key] = [firstRowJSON[key]];
            }
        }
    }
    jsonList.push(firstRowJSON);
    fs.writeFileSync('./jsons/' + firstRowJSON['conceptId'] + '.json', JSON.stringify(firstRowJSON,null, 2))
    return cluster;

}

function findJSON(jsonList, questionText){
    //console.log('finding: ' + questionText)
    for(let i = 0; i < jsonList.length;i++){
        let json = jsonList[i];
        if(json['Question Text'] == questionText){
            return json;
        }
    }
    return undefined;
}

function CSVToArray(strData){
    let orig = strData;
    strData = strData.trim();
    let arr = [];
    let finalPush = true;
    while(strData.indexOf(",") != -1 ){
        let toPush = "";
        
        if(strData.substring(0,1) == "\""){
            strData = strData.substring(1);            
            let nextLook = strData.indexOf('\"\"')
            let nextQuote = strData.indexOf('\"');

            while(nextLook != -1 && nextLook == nextQuote){
                ////console.log(nextLook)
                toPush += strData.substring(0,nextLook) + '\"\"'
                strData = strData.substring(strData.indexOf("\"\"") + 2);    
                if(orig.includes('Ever took hormones to reflect your gender')){
                    ////console.log(strData.substring(strData.indexOf("\"\"") + 2));
                    ////console.log('------------------------')
                }
                nextLook = strData.indexOf('\"\"')
                nextQuote = strData.indexOf('\"');
            }

            toPush += strData.substring(0,  strData.indexOf("\""));    
            strData = strData.substring(strData.indexOf("\"") + 1);    
            if(orig.includes('Ever took hormones to reflect your gender')){
                ////console.log(strData.substring(strData.indexOf("\"") + 1));
                ////console.log('------------------------')
            }
            strData = strData.substring(strData.indexOf(',')+1)
            if(strData.trim() == ''){
                finalPush = false
            }
        }
        else{
            toPush = strData.substring(0, strData.indexOf(','));
            strData = strData.substring(strData.indexOf(',') + 1)
        }
        arr.push(toPush.trim())

        //let nextQuote = strData.indexOf("\"")
    }
    if(finalPush == true){
        arr.push(strData.trim());
    }

    // Return the parsed data.
    return( arr );
}

function getConceptIdCols(header){
    let toReturn = {}
    for(let i = 0; i < header.length;i++){
        if(header[i] == 'conceptId'){
            if(i + 1 < header.length && header[i+1] != 'conceptId'){
                toReturn[i] = header[i+1];
            }
            else{
                console.error('Header Error (conceptIds not in correct place)')
            }
            
        }
    }
    return toReturn
    
}

//Reads in an excel file, creates the json files, and adds the concept ids into the excel file
async function readFile(fileName){
    let jsonList = []
    let sourceJSONS = []
    fs.readdirSync('./jsons/').forEach(file => {
        /*if(file.match(/[0-9]{9}.json/)){
            let currFileContents = fs.readFileSync('./jsons/' + file);
            let currJSON = JSON.parse(currFileContents)
            sourceJSONS.push(currJSON);
        }*/
    });

    //Reads in the varToConcept json file for blank ids
    let ConceptIndex = '{}'
    if(fs.existsSync('./jsons/varToConcept.json')){
        ConceptIndex = fs.readFileSync('./jsons/varToConcept.json', {encoding:'utf8'})
    }

    //Reads in the array of used conceptIds
    let idIndex = '[]'
    if(fs.existsSync('./jsons/conceptIds.txt')){
        idIndex = fs.readFileSync('./jsons/conceptIds.txt', {encoding:'utf8'})
    }
    let conceptIdList = JSON.parse(idIndex)
    let varLabelIndex = 0;
    let cluster = []
    
    //const fileStream = fs.createReadStream(fileName);
    //const outFile = 'prelude1Concept1.csv'
    let excelOutput = []
    

    //reads file using xlsx api
    filename = 'csv/masterFile.xlsx'
    let workbook = XLSX.readFile(filename, {'cellStyles':true, 'sheetStubs':true});

    console.log(workbook.SheetNames.indexOf('MasterFile'))
    let sheet = workbook.Sheets[workbook.SheetNames[workbook.SheetNames.indexOf('MasterFile')]]
    let matrix = sheet2arr(sheet)


    let first = true;
    let second  = true;
    let currCluster = false;
    let header = [];
    let conceptCols = [];
    let conceptIdObject = {};
    let nameToConcept = JSON.parse(ConceptIndex);

    //Reads through the excel file line by line
    for(let i = 0; i < matrix.length; i++){
        let arr = matrix[i]
        for (let j = 0; j < matrix[i].length; j++){
            if(matrix[i][j] == undefined){
                matrix[i][j] = ''
            }
        }
        if(first){
            conceptIdObject = getConceptIdCols(arr)
            //console.log('abc')
            //console.log(conceptIdObject)
            header = arr;
            first = false;
            for(let i = 0; i < arr.length; i++){
                if(arr[i] == "Question Text"){
                    varLabelIndex = i;
                }
                if(arr[i] == "conceptId" && i+1 < arr.length){
                    conceptCols.push(i+1)
                }
            }
            excelOutput.push([arr])
        }
        else if(currCluster){
            if(arr[varLabelIndex] == ''){
                cluster.push(arr);
            }
            else{
                let returned = processCluster(cluster, header, nameToConcept, varLabelIndex, conceptIdList, conceptIdObject, sourceJSONS, jsonList, /[0-9]+\s*=/)
                excelOutput.push(returned)
                cluster = [arr]
                currCluster = true;
            }
        }
        else{
            cluster.push(arr)
            currCluster = true;
        }
    }
    let returned = processCluster(cluster, header, nameToConcept, varLabelIndex, conceptIdList, conceptIdObject, sourceJSONS, jsonList,/[0-9]+\s*=/);
    excelOutput.push(returned)
    
    //checks to see if the concept we are looking for already exists
    for(let i = 0; i < sourceJSONS.length; i++){
        let found = false;
        let result = {};
        for(let j = 0; j < jsonList.length; j++){
            let currJ = jsonList[j];
            let currS = sourceJSONS[i];
            if(currJ.conceptId == currS.conceptId){
                
                let key;

                for (key in currS) {
                    if(currS.hasOwnProperty(key)){
                        result[key] = currS[key];
                    }
                }

                for (key in currJ) {
                    if(currJ.hasOwnProperty(key)){
                        result[key] = currJ[key];
                        
                    }
                }
                found = true;
                jsonList[j] = result
            }
        }   
        //Writes the json files
        if(!found){
            jsonList.push(sourceJSONS[i])
            fs.writeFileSync('./jsons/' + sourceJSONS[i]['conceptId'] + '.json', JSON.stringify(sourceJSONS[i],null, 2));

        }
        else{
            fs.writeFileSync('./jsons/' + sourceJSONS[i]['conceptId'] + '.json', JSON.stringify(result,null, 2))
        }
        
    }
    fs.writeFileSync('./jsons/varToConcept.json', JSON.stringify(nameToConcept))
    fs.writeFileSync('./jsons/conceptIds.txt', JSON.stringify(conceptIdList))
    let toPrint = [];

    for(let i=0; i < excelOutput.length; i++){
        let cluster = excelOutput[i]
        for(let j = 0; j < cluster.length; j++){
            let row = cluster[j]
            toPrint.push(row)
        }
    }
    //fs.writeFileSync(fileName, toPrint)
    console.log(toPrint[0])
    console.log(workbook.utils)
    
    let workbookStyle = XLSXStyle.readFile(filename, {'cellStyles':true, 'sheetStubs':true});
    let sheetStyle = workbookStyle.Sheets[workbookStyle.SheetNames[workbookStyle.SheetNames.indexOf('MasterFile')]]
    let styles = sheet2Styles(sheetStyle)
    let cols = []
    let rows = []
    for(let i = 0; i < workbook.SheetNames.length; i++){
        cols.push(workbookStyle.Sheets[workbook.SheetNames[i]]['!cols'])
        rows.push(workbookStyle.Sheets[workbook.SheetNames[i]]['!rows'])
    }
    XLSX.utils.sheet_add_aoa(workbook.Sheets[workbook.SheetNames[workbook.SheetNames.indexOf('MasterFile')]],toPrint)
    
    //workbook.Sheets[workbook.SheetNames[workbook.SheetNames.indexOf('MasterFile')]] = currSheet
    

    XLSX.writeFile(workbook, fileName, {'cellStyles': true});

    let workbookStyleWrite = XLSXStyle.readFile(filename, {'cellStyles':true, 'sheetStubs':true});
    let sheetToWrite = workbook.Sheets[workbook.SheetNames[workbook.SheetNames.indexOf('MasterFile')]]
    applyStyles(sheetToWrite, styles)
    for(let i = 0; i < workbook.SheetNames.length; i++){
        workbook.Sheets[workbook.SheetNames[i]]['!cols'] = cols[i] 
        workbook.Sheets[workbook.SheetNames[i]]['!rows'] = rows[i] 
    }
    XLSXStyle.writeFile(workbook, fileName, {'cellStyles': true});

    let timestamp = new Date().toISOString().split('.')[0].replace(/:/g, '-').replace('T', '-');
    let filenameOutside = './csvHistory/Quest-' + timestamp + '_Concept_Id_Dict.xlsx';
    let filenameVarGen = './csvHistory/Quest-' + timestamp + '_Concept_ID_Gen.json'
    fs.writeFileSync(filenameVarGen,JSON.stringify(nameToConcept,null, 2))

    //fs.writeFileSync(filenameOutside,toPrint)

    XLSXStyle.writeFile(workbook, filenameOutside, {'cellStyles': true});

}

function sheet2arr(sheet){
   var result = [];
   var row;
   var rowNum;
   var colNum;
   var range = XLSX.utils.decode_range(sheet['!ref']);
   for(rowNum = range.s.r; rowNum <= range.e.r; rowNum++){
      row = [];
       for(colNum=range.s.c; colNum<=range.e.c; colNum++){
          var nextCell = sheet[
             XLSX.utils.encode_cell({r: rowNum, c: colNum})
          ];
          if( typeof nextCell === 'undefined' ){
             row.push(void 0);
          } else {
            if(nextCell.w != undefined){
                row.push(nextCell.w.trim())
            }  
            else{
                row.push(nextCell.w);
            }
          }
       }
       result.push(row);
   }
   return result;
};



function sheet2Styles(sheet){
    var range = XLSXStyle.utils.decode_range(sheet['!ref']);
    var result = [];
    var row;
    var rowNum;
    var colNum;
    for(rowNum = range.s.r; rowNum <= range.e.r; rowNum++){
        row = [];
        for(colNum=range.s.c; colNum<=range.e.c; colNum++){
            var nextCell = sheet[
                XLSXStyle.utils.encode_cell({r: rowNum, c: colNum})
            ];
            //row.push(sheet[XLSXStyle.utils.encode_cell({r: rowNum, c: colNum})].s)
            if( typeof nextCell === 'undefined' ){
                row.push({});
                //console.log( XLSXStyle.utils.encode_cell({r: rowNum, c: colNum}))
            } else {
                if(nextCell.s.hasOwnProperty('border')){
                    delete nextCell.s.border
                }
                row.push(nextCell.s);
                
            }
        }
        result.push(row);
    }
    //console.log(result[0])
    return result
}

function applyStyles(sheet, styles){
    var range = XLSX.utils.decode_range(sheet['!ref']);
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
                if (JSON.stringify(styles[rowNum][colNum]) != '{}'){
                    sheet[
                        XLSX.utils.encode_cell({r: rowNum, c: colNum})
                    ].s = styles[rowNum][colNum]
                }
            } else{
                //console.log(styles)
                //console.log(styles[rowNum][colNum])
                console.log(rowNum)
                if (JSON.stringify(styles[rowNum][colNum]) != '{}'){
                    nextCell.s = styles[rowNum][colNum]
                }
                
            } 
        }
    }
}

module.exports = {
    readFile:readFile
}

//let filename = 'csv/masterFile.xlsx'
//readFile(filename)