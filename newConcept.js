
  
  async function getBorders(sheetName){
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet1 = spreadsheet.getSheetByName(sheetName);  
  
    var spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    let matrix = sheet1.getDataRange().getValues();
        
    console.log(sheet1.getRange(1,1).getA1Notation() + ':' + sheet1.getRange(matrix.length, matrix[0].length).getA1Notation())
    let toCheckRange = sheet1.getRange(1,1).getA1Notation() + ':' + sheet1.getRange(matrix.length, matrix[0].length).getA1Notation();
    let currJSON = await Sheets.Spreadsheets.get(spreadsheetId, {ranges:[toCheckRange], fields: "sheets/data/rowData/values/userEnteredFormat/borders"});
    console.log(JSON.stringify(currJSON));
    //debugPrint(JSON.stringify(currJSON))
    return currJSON;
    //let currBorderJSON = await Sheets.Spreadsheets.get(spreadsheetId, {ranges: sheet1.getName() + "!" + sheet1.getRange(i+1,2).getA1Notation(), fields: "sheets/data/rowData/values/userEnteredFormat/borders"} });
  }
  
  function getCSVSheets (){
    var toReturn = [];
    var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
    for (var i=0 ; i<sheets.length ; i++) {
      if(sheets[i].getName().includes('csv')){
        toReturn.push(sheets[i]);
      }
    }
    console.log(toReturn)
    return toReturn;
  
  }
  
  function getRegEx() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet1 = spreadsheet.getSheetByName('VariantRules');  
    let data = sheet1.getDataRange().getValues(); 
    console.log(data)
    let toReturn = [];
    for(let i = 1; i < data.length; i++){
      toReturn.push(data[i]);
    }
    console.log(toReturn)
    return toReturn;
  
  }
  
  function testingReg () { 
    let borders = getBorders('abc')
    console.log(JSON.stringify(borders));
  }
  
  function replaceReg(regExList, header, toInsert) {
    
    for(let i = 0; i < regExList.length; i++){
      let currList = regExList[i];
      if(currList[0] == header){
        let currEx = new RegExp(currList[1]);
        console.log(currEx)
  
        let toReturn = toInsert.replace(currEx, currList[2]);
        if(toInsert.match(currEx)){
          return toReturn;
        }
        
      }
    }
    return toInsert;
  }
  
  function logout() {
    var service = getOAuthService()
    service.reset();
    var ui = SpreadsheetApp.getUi();
    
    if(!service.hasAccess()){
      ui.createMenu('Processing')
      .addItem('Login','showSidebar')
      .addToUi();
    }
  }
  
  function pushFile(repo, owner, message, name, email, content, filename, encodedContent) {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var githubSheet = spreadsheet.getSheetByName('GithubInfo');
    var driveService = getOAuthService();
    
    /*let repo = githubSheet.getRange('A2').getValue();
    let owner = githubSheet.getRange('B2').getValue();
    let message = githubSheet.getRange('C2').getValue();
    let name = githubSheet.getRange('D2').getValue();
    let email = githubSheet.getRange('E2').getValue();
    let content = githubSheet.getRange('F2').getValue();
    let filename = githubSheet.getRange('G2').getValue();
    let encodedContent = Utilities.base64Encode(content);
  */
    let returned = UrlFetchApp.fetch('https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + filename, {
      headers: {
        Authorization: 'token ' + driveService.getAccessToken()
      },
      muteHttpExceptions:true});
    let process = JSON.parse(returned.getContentText());
    let sha = '';
    if(process.hasOwnProperty('sha')){
      sha = process['sha'];
    }
    
    console.log(driveService.getAccessToken());
    
    
    let a = {"path": filename, "message": message, "committer": {"name": name, "email": email}, "content": encodedContent};
    if(process.hasOwnProperty('sha') != ''){
      a['sha'] = process['sha'];
    }
    console.log(JSON.stringify(a));
    var response = UrlFetchApp.fetch('https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + filename, {
      method:"PUT",
      headers: {
        Authorization: 'token ' + driveService.getAccessToken()
      },
      payload: JSON.stringify(a)
    });
    Logger.log(JSON.stringify(response));
    
  }
  
  async function pushFilesToGithub(){
    //var sheet4 = spreadsheet.getSheets()[3];
    await csvToJSONs();
    
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    var sheet2 = spreadsheet.getSheetByName('json-ld');
    var sheet4 = spreadsheet.getSheetByName('conceptIdToVariableName');
    let data = sheet2.getDataRange().getValues();
    let conceptToVarData = sheet4.getDataRange().getValues();
    var githubSheet = spreadsheet.getSheetByName('GithubInfo');
    let repo = githubSheet.getRange('A2').getValue();
    let owner = githubSheet.getRange('B2').getValue();
    let message = githubSheet.getRange('C2').getValue();
    let name = githubSheet.getRange('D2').getValue();
    let email = githubSheet.getRange('E2').getValue();
    //let content = githubSheet.getRange('F2').getValue();
    //let filename = githubSheet.getRange('G2').getValue();
    //let encodedContent = Utilities.base64Encode(content);
    let obj = {}
    
    //aggregate sheet jsonld and concepttovar
    let jsonList = {};
    
    
    for(let i = 0; i < data.length; i++){
      Logger.log(data[i][0])
      let currJSON = JSON.parse(data[i][0]);
      if(currJSON.hasOwnProperty('conceptId')){
        jsonList[currJSON['conceptId']] = currJSON;
      }
    }
    for(let i = 1; i < conceptToVarData.length; i++){
      let currJSON = {"conceptId":conceptToVarData[i][0], "Variable Name": conceptToVarData[i][1]};
      if(jsonList.hasOwnProperty(currJSON['conceptId'])){
        jsonList[currJSON['conceptId']]['Variable Name'] = currJSON['Variable Name'];
      }
      else{
        jsonList[currJSON['conceptId']] = currJSON;
      }
    }
    
    let keys = Object.keys(jsonList);
    
    for(let i = 0; i < keys.length; i++){
      let currJSON = jsonList[keys[i]];
      let content = JSON.stringify(currJSON);
      let filename = keys[i];
      let encodedContent = Utilities.base64Encode(content);
      //TO UNCOMMENT
      pushFile(repo, owner, message, name, email, content, filename, encodedContent);
    }
    //return obj;
  }
  
  function driver(){
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var fourthSheet = spreadsheet.getSheetByName('conceptIdToVariableName');
    pushFilesToGithub(fourthSheet);
  }
  
  
  async function csvToJSONs() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    
    let csvSheets = getCSVSheets();
  
    var firstSheet = spreadsheet.getSheets()[0];
    var secondSheet = spreadsheet.getSheetByName('json-ld');
    var thirdSheet = spreadsheet.getSheetByName('rdf');
    var fourthSheet = spreadsheet.getSheetByName('conceptIdToVariableName');
    var spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    let borders = await getBorders('csv');
    /*const rangeToBeLinked = firstSheet.getRange('A2');
    const rangeToAddLink = firstSheet.getRange('B4');
    const richText = SpreadsheetApp.newRichTextValue()
    .setText('Click to go to ' + rangeToBeLinked.getA1Notation())
    .setLinkUrl('#gid=' + firstSheet.getSheetId() + '&range=' + 'A' + rangeToBeLinked.getRow())
    .build();
    rangeToAddLink.setRichTextValue(richText );
    */
    var varToConcept = getVarToConcept(fourthSheet);
    
    //firstSheet.getRange('B5').setFormula('=hyperlink("google.com","GOOGLE")');
  
    //var spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    //var res = Sheets.Spreadsheets.get(spreadsheetId, {ranges: "Sheet1!2,2", fields: "sheets/data/rowData/values/userEnteredFormat/borders"});
    //Logger.log(JSON.stringify(res));
    /*
    var spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    let a = firstSheet.getRange(2,4).getA1Notation();
    Logger.log(a)
    var res = await Sheets.Spreadsheets.get(spreadsheetId, {ranges: firstSheet.getName() + "!" + a, fields: "sheets/data/rowData/values/userEnteredFormat/borders"});
    Logger.log(JSON.stringify(res))
    
    a = firstSheet.getRange(3,4).getA1Notation();
    Logger.log(a)
    res = await Sheets.Spreadsheets.get(spreadsheetId, {ranges: firstSheet.getName() + "!" + a, fields: "sheets/data/rowData/values/userEnteredFormat/borders"});
    Logger.log(JSON.stringify(res))
    */
    
    
    let colors = getColored(firstSheet);
    await readFile('',firstSheet, secondSheet, thirdSheet, fourthSheet, varToConcept, colors, spreadsheetId, borders['sheets'][0]['data']);
    //await readFile('',csvSheets, secondSheet, thirdSheet, fourthSheet, varToConcept, colors, spreadsheetId);
  
    //let a = "abc"
    //Logger.log(a.substring(0,2));
    //firstSheet.getRange(1,1).setValue("123");
    /*
    var sheet = SpreadsheetApp.getActiveSheet();
    if(sheet.getName() == firstSheet.getName()){
    Logger.log("nice");
    }
    var data = sheet.getDataRange().getValues();
    Logger.log(sheet.getName());
    for (var i = 0; i < data.length; i++) {
    Logger.log('Product name: ' + data[i][0]);
    Logger.log('Product number: ' + data[i][1]);
    }
    sheet.getRange(2, 3).setValue("abc")*/
  }
  
  function getColored(sheet){
    let colors = [];
    let data = sheet.getDataRange().getValues();
    for(let i = 0; i < data.length; i++){
      let arr = [];
      for(let j = 0; j < data[i].length; j++){
        let thisCell = sheet.getRange(i+1, j+1);
        if(thisCell.getBackground() != "#ffffff"){
         arr.push("x")
        }
        else{
          arr.push("");
        }
      }
      colors.push(arr)
    }
    
    return colors;
  }
  
  function getVarToConcept(sheet4){
    //var sheet4 = spreadsheet.getSheets()[3];
    let data = sheet4.getDataRange().getValues();
    let obj = {}
    for(let i = 0; i < data.length; i++){
      if(i > 0){
        obj[data[i][1]] = data[i][0];
      }
    }
    return obj;
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
      return num + ".json";
    }
  }
  
  function getCurrIds(){
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet1 = spreadsheet.getSheets()[0];
    let sheet4 = spreadsheet.getSheetByName('conceptIdToVariableName');
    let conceptIdList = [];
    let data = sheet1.getDataRange().getValues();
    for(let i = 1; i < data.length; i++){
      let concept = data[i][0]
      if(concept != ""){
        if(!conceptIdList.includes(concept)){
          conceptIdList.push(concept);
        }
      }
    }
    let dataSheet4 = sheet4.getDataRange().getValues();
    for(let i = 1; i < dataSheet4.length; i++){
      let concept = dataSheet4[i][0]
      if(concept != ""){
        if(!conceptIdList.includes(concept)){
          conceptIdList.push(concept);
        }
      }
    }  
    
    return conceptIdList;
    
  }
  function processCluster(cluster, header, conceptIdList, sourceJSONS, jsonList, fileName, varToConcept, colorCluster){
    let thisRowJSON= {}
    debugPrint('startingCluster: ' + JSON.stringify(cluster))
    let regexList = getRegEx();
    for (let j = 0; j < cluster.length; j++){
      let arr = cluster[j];
      for(let i = 0; i < arr.length; i++){
        if(j == 0){
          if(arr[i] != ""){
            let toInsert = replaceReg(regexList,header[i], arr[i]);
            thisRowJSON[header[i]] = toInsert
            if(colorCluster[j][i] != ""){
              if(varToConcept.hasOwnProperty(toInsert)){
                thisRowJSON[header[i]] = varToConcept[toInsert]
              }
              else{
                thisRowJSON[header[i]] = generateRandomUUID(conceptIdList);
                varToConcept[toInsert] = thisRowJSON[header[i]];
                //assign new conceptId
              }
            }
          }
        }
        else if(j == 1 && arr[i] != ""){
          let toInsert = replaceReg(regexList,header[i], arr[i]);
          let currVal = toInsert;
          if(varToConcept.hasOwnProperty(toInsert)){
            currVal = varToConcept[toInsert]
          }
          //THIS IS WHERE YOU WANT TO REPLACE
          if(colorCluster[j][i] != ""){
            if(varToConcept.hasOwnProperty(toInsert)){
              thisRowJSON[header[i]] = [thisRowJSON[header[i]]]
              thisRowJSON[header[i]].push(varToConcept[toInsert])
            }
            else{
              let newuuid = generateRandomUUID(conceptIdList);
              varToConcept[toInsert] = newuuid;
              thisRowJSON[header[i]] = [thisRowJSON[header[i]]]
              thisRowJSON[header[i]].push(newuuid)
              
              
              //assign new conceptId
            }
          }
          else{
            thisRowJSON[header[i]] = [thisRowJSON[header[i]]]
            thisRowJSON[header[i]].push(currVal);
          }
          
          
        }
        else if(arr[i] != ""){
          let toInsert = replaceReg(regexList,header[i], arr[i]);
          let currVal = toInsert
          
          if(colorCluster[j][i] != ""){
            if(varToConcept.hasOwnProperty(toInsert)){
              thisRowJSON[header[i]].push(varToConcept[toInsert])
            }
            else{
              let newuuid = generateRandomUUID(conceptIdList);
              varToConcept[toInsert] = newuuid;
              thisRowJSON[header[i]].push(newuuid)
              
              
              //assign new conceptId
            }
          }
          else{
            if(varToConcept.hasOwnProperty(toInsert)){
              currVal = varToConcept[toInsert]
            }
            if(!Array.isArray(thisRowJSON[header[i]])){
              thisRowJSON[header[i]] = [thisRowJSON[header[i]]]
            }
            thisRowJSON[header[i]].push(currVal);
          }
        }
      }
    }
    
    
    if(!thisRowJSON.hasOwnProperty('conceptId') || thisRowJSON['conceptId'] == ''){
      thisRowJSON['conceptId'] = generateRandomUUID(conceptIdList);
      conceptIdList.push(thisRowJSON['conceptId'])
    }
    thisRowJSON['@context'] = fileName
    
    cluster[0][0] = thisRowJSON['conceptId']
    jsonList.push(thisRowJSON);
    //fs.writeFileSync('./jsons/' + thisRowJSON['conceptId'] + '.json', JSON.stringify(thisRowJSON,null, 2))
    return cluster;
  }
  
  
  function CSVToArray(strData){
    strData = strData.trim();
    let arr = [];
    let finalPush = true;
    while(strData.indexOf(",") != -1 ){
      let toPush = "";
      
      if(strData.substring(0,1) == "\""){
        strData = strData.substring(1);            
        let nextLook = strData.indexOf('\"\"')
        
        while(nextLook != -1){
          console.log(nextLook)
          toPush += strData.substring(0,nextLook) + '\"\"'
          strData = strData.substring(strData.indexOf("\"\"") + 2);    
          nextLook = strData.indexOf('\"\"')
        }
        
        toPush += strData.substring(0,  strData.indexOf("\""));    
        strData = strData.substring(strData.indexOf("\"") + 1);    
        strData = strData.substring(strData.indexOf(',')+1)
        if(strData.trim() == ''){
          finalPush = false
        }
      }
      else{
        toPush = strData.substring(0, strData.indexOf(','));
        strData = strData.substring(strData.indexOf(',') + 1)
      }
      arr.push(toPush)
      
      //let nextQuote = strData.indexOf("\"")
    }
    if(finalPush == true){
      arr.push(strData);
    }
    
    // Return the parsed data.
    return( arr );
  }
  
  async function getConceptIds(data, sheet1, sheet2){
    //first, get all columns that require conceptids
    //next, check if column to the right has concept id
    //if it does, add to array, if it doesnt, maybe add to file
    //keywords: source
    //Look for columns with clusters
    let varLabelIndex = 0;
    let cluster = []
    let first = true;
    let currCluster = false;
    let header = [];
    let idToInsert = 0;
    let idsFound = []
    let conceptIdIndices = []
    
    for (let i = 0; i < data.length; i++){
      let arr = data[i]
      if(first){
        header = arr;
        first = false;
        if(arr[0] == "conceptId"){
          idToInsert = 1
        }
      }
    }
    
    if(idToInsert == 0){
      let toWrite ='';
      first = true;
      let finalConceptIndices = {};
      for(let i = 0; i < data.length; i++){
        let arr = data[i];
        if(first == true){
          
          arr.splice(0,0,'conceptId')
          for(let j = 0; j < arr.length; j++){
            sheet1.getRange(i+1,j+1).setValue(arr[j])
          }
          first = false;
        }   
        else{
          arr.splice(0,0,'')
          for(let j = 0; j < arr.length; j++){
            sheet1.getRange(i+1,j+1).setValue(arr[j])
          }
        }
      }
    }
  }
  
  async function readFile(fileName, sheet1, sheet2, sheet3, sheet4, varToConcept, colors, spreadsheetId, borders){
    let jsonList = []
    let sourceJSONS = []
    
    let conceptIdList = []
    
    let varLabelIndex = 0;
    let cluster = []
    let colorCluster = [];
    let data = sheet1.getDataRange().getValues(); 
    
    
    let page4order = [];
    let dataSheet4 = sheet4.getDataRange().getValues();
    for(let i = 1; i < dataSheet4.length; i++){
      let varName = dataSheet4[i][1]
      if(varName != ""){
          page4order.push(varName);
      }
    }  
    await getConceptIds(data, sheet1, sheet2)
    conceptIdList = getCurrIds();
    let excelOutput = []
    
    let first = true;
    let header = [];
    let clusterId = -1;
    for(let i = 0; i < data.length; i++){
      //let arr = line.split(',');
      let arr = data[i]
      let colorArr = colors[i];
      //let currBorderJSON = await Sheets.Spreadsheets.get(spreadsheetId, {ranges: sheet1.getName() + "!" + sheet1.getRange(i+1,2).getA1Notation(), fields: "sheets/data/rowData/values/userEnteredFormat/borders"});
      let currBorderInfo = {}
      //
      if(borders[0]['rowData'][i].hasOwnProperty('values')){
        currBorderInfo= borders[0]['rowData'][i]['values'][0]['userEnteredFormat']['borders']
      }
      /*
      if(currBorderJSON.hasOwnProperty("sheets")){
        currBorderJSON = currBorderJSON["sheets"];
        if(currBorderJSON.length > 0 && currBorderJSON[0].hasOwnProperty("data")){
          currBorderJSON = currBorderJSON[0]["data"];
          if(currBorderJSON.length > 0 && currBorderJSON[0].hasOwnProperty("rowData")){
            currBorderJSON = currBorderJSON[0]["rowData"];
            if(currBorderJSON.length > 0 && currBorderJSON[0].hasOwnProperty("values")){
              currBorderJSON = currBorderJSON[0]["values"];
              if(currBorderJSON.length > 0 && currBorderJSON[0].hasOwnProperty("userEnteredFormat")){
                currBorderJSON = currBorderJSON[0]["userEnteredFormat"];
                if(currBorderJSON.hasOwnProperty("borders")){
                  //currBorderInfo = currBorderJSON["borders"];
                  debugPrint('Border2: ' + JSON.stringify(currBorderJSON["borders"]))
                }
              }
            }
          }
        }
      }*/
      Logger.log(JSON.stringify(currBorderInfo));
                  
        
      if(first){
        header = arr;
        first = false;
        excelOutput.push([arr])
        clusterId = header.indexOf('clusterIdentifier');
        cluster = [];
      }
      /*else if(clusterId == -1){
        cluster.push(arr);
        colorCluster.push(colorArr)
        let returned = processCluster(cluster, header, conceptIdList, sourceJSONS, jsonList, fileName, varToConcept, colorCluster)
        excelOutput.push([returned[0]])
        
        cluster = [];
        colorCluster = [];
      }*/
      else if(currBorderInfo.hasOwnProperty('bottom')){
        cluster.push(arr);
        colorCluster.push(colorArr);
        let returned = processCluster(cluster, header, conceptIdList, sourceJSONS, jsonList, fileName, varToConcept, colorCluster);  
        excelOutput.push(returned);
        cluster = [];
        colorCluster = [];
      }
      else if(!currBorderInfo.hasOwnProperty("top")){
        cluster.push(arr);
        colorCluster.push(colorArr);
      }
      
      else{
        if(cluster.length > 0){
          Logger.log(JSON.stringify(cluster));
          let returned = processCluster(cluster, header, conceptIdList, sourceJSONS, jsonList, fileName, varToConcept, colorCluster);  
          /*for(let j = 0; j < returned.length; j++){
            excelOutput.push(returned[j])
          }*/
          excelOutput.push(returned);
        }
        cluster = [];
        colorCluster = [];
        cluster.push(arr);
        colorCluster.push(colorArr);
      }
    }
    if(cluster.length != 0){
      let returned = processCluster(cluster, header, conceptIdList, sourceJSONS, jsonList, fileName, varToConcept, colorCluster)
      /*for(let j = 0; j < returned.length; j++){
        excelOutput.push(returned[j])
      }*/
      excelOutput.push(returned);
    }
    sheet3.clear();
    sheet2.clear();
    //fs.writeFileSync('./jsons/conceptIds.txt', JSON.stringify(conceptIdList))
    sheet3.getRange(1,1).setValue("Subject")
    sheet3.getRange(1,2).setValue("Verb")
    sheet3.getRange(1,3).setValue("Object")
    let currRow = 2;
    for(let i = 0; i < jsonList.length; i++){
      sheet2.getRange(i+1,1).setValue(JSON.stringify(jsonList[i] ));
      let keys = Object.keys(jsonList[i]);
      for(let j = 0; j < keys.length; j++){
        if(keys[j] != '@context'){
          if(Array.isArray(jsonList[i][keys[j]])){
            
            for(let k = 0; k < jsonList[i][keys[j]].length; k++){
              sheet3.getRange(currRow,1).setValue(jsonList[i]['conceptId']);
              sheet3.getRange(currRow,2).setValue(keys[j]);
              sheet3.getRange(currRow,3).setValue(jsonList[i][keys[j]][k]);
              currRow += 1;
            }
          }
          else{
            sheet3.getRange(currRow,1).setValue(jsonList[i]['conceptId']);
            sheet3.getRange(currRow,2).setValue(keys[j]);
            sheet3.getRange(currRow,3).setValue(jsonList[i][keys[j]]);
            currRow += 1;
          }
          
        }
      }
    }
      let toPrint = '';
    currRow = 0;
      let regexList = getRegEx();
      for(let i=0; i < excelOutput.length; i++){
        let cluster = excelOutput[i]
        for(let k = 0; k < cluster.length; k++){
          let arr = cluster[k];
          for(let j = 0; j < arr.length; j++){
            if(colors[currRow][j] != ""){
              let conKeys = Object.keys(varToConcept);
              let filtered = replaceReg(regexList,header[j], arr[j]);
              let indexOfCurr = conKeys.indexOf(filtered)
              if(indexOfCurr != -1){
                
                const rangeToBeLinked = sheet4.getRange(indexOfCurr + 2, 1);
                const rangeToAddLink = sheet1.getRange(currRow+1, j+1);
                const richText = SpreadsheetApp.newRichTextValue()
                .setText(arr[j])
                .setLinkUrl('#gid=' + sheet4.getSheetId() + '&range=' + 'A' + rangeToBeLinked.getRow())
                .build();
                rangeToAddLink.setRichTextValue(richText );
                
              }
              else{
                sheet1.getRange(currRow+1,j+1).setValue(arr[j])
              }
            }
            else{
              sheet1.getRange(currRow+1,j+1).setValue(arr[j])
            }
          }
          currRow += 1;
        }
      }
    
    let jsonKeys = Object.keys(varToConcept);
    for(let i = 0; i < jsonKeys.length; i++){
     sheet4.getRange(i+2,1).setValue(varToConcept[jsonKeys[i]])
     sheet4.getRange(i+2,2).setValue(jsonKeys[i])
    }
    debugPrint('varToConcept: ' + JSON.stringify(varToConcept))
      //print toPrint to csv
    
  }
  
  
  function generateNewConceptId(){
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet5 = spreadsheet.getSheetByName('generateConceptId');
    let conceptIdLists = getCurrIds();
    let newConcept = generateRandomUUID(conceptIdLists);
    sheet5.getRange(1,1).setValue("New Concept");
    sheet5.getRange(2,1).setValue(newConcept);
  }