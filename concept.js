//See if actions works on forks
const fs = require('fs');
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

/**
 * processCluster - for the current row as a readable streamline file
 * @param {array} cluster - current row after header row, array of row cell items within an array
 * @param {array} header - header items of the first row
 * @param {object} nameToConcept - varToConcept object library mapping --> Ex.{"0":"918573169","1":"349122068","Sanford Health":"657167265", "Menstrual Cycle":"232438133"}
 * @param {number} indexVariableName - conceptId index location of question Text - should be 10
 * @param {object} conceptIdList - object type array from conceptIds.txt file
 * @param {object} conceptIdObject - object mapping of conceptId index value to next header string value --> Ex. { 2: 'Primary Source', 4: 'Secondary Source', 6: 'Source Question', 9: 'Question Text', 16: 'Format/Value'}
 * @param {array} sourceJSONS - array of objects from each individual concept id json
 * @param {array} jsonList - empty array []
 * @param {string} regexInclude - regex string /[0-9]+\s*=/
 *  
 */

function processCluster(cluster, header, nameToConcept, indexVariableName, conceptIdList, conceptIdObject, sourceJSONS, jsonList, regexInclude){
    // console.log(cluster[0])
    let nonEmpty = [];
    let conceptIdObjectKeys =Object.keys(conceptIdObject)
    let conceptIdIndices = [];
    let generalId = -1;
    let conceptIdReverseLookup = {}; // Ex. {Primary Source: 2, Secondary Source: 4, Current Source Question: 6, Current Question Text: 13, Current Format/Value: 22}
    
    
    for(let i = 0; i < conceptIdObjectKeys.length; i++){
        conceptIdIndices.push(parseInt(conceptIdObjectKeys[i]))
        conceptIdReverseLookup[conceptIdObject[conceptIdObjectKeys[i]]] = parseInt(conceptIdObjectKeys[i])
    }
    let isDeprecated = false;
    for(let i = 1; i < cluster.length; i++){
        let currArr = cluster[i]
        // console.log("TEST",currArr)
        for(let j = 0; j < currArr.length; j++){
            if(currArr[j].trim()!='' && !conceptIdIndices.includes(j)){ // Are there any non-empty cells in the rows?
                if(!nonEmpty.includes(j)){
                    nonEmpty.push(j)
                }
            }
        }
    }
    // Add variable to determine if things should be added to varToConcept.json or have it pushed 
    let firstRowJSON = {}
    let firstRow = cluster[0]
    // console.log("🚀 ~ firstRow:", firstRow.includes('Deprecated'))
    // console.log("🚀 ~ firstRow:", firstRow.includes('Deprecated'))
    // isDeprecated = firstRow.includes('Deprecated'); // check if the first row includes 'Deprecated'
    let deprecatedNewRevisedIndex = header.indexOf('Deprecated, New, or Revised'); // check if the header includes 'Deprecated, New, or Revised'
    let deprecatedNewRevisedValue = cluster[0][deprecatedNewRevisedIndex]; // check if the first row includes 'Deprecated, New, or Revised'
    // console.log("🚀 ~ deprecatedNewRevisedValue:", deprecatedNewRevisedValue)
    isDeprecated = deprecatedNewRevisedValue === "Deprecated"; // check if the first row includes 'Deprecated' [Might reqwrite to be first row]
    let clump = [];
    for(let i = 0; i < firstRow.length; i++){
        if((firstRow[i] != "" && !nonEmpty.includes(i) && !conceptIdIndices.includes(i)) 
            || (conceptIdIndices.includes(i) && conceptIdObject[i] =="Current Question Text")){
            firstRowJSON[header[i]] = firstRow[i]
        }
    }
    //Creating concept Id for the cluster
    // TODO: add conditional to prevent deprecated concept Id
    if(!firstRowJSON.hasOwnProperty('conceptId') || firstRowJSON['conceptId'] == ''){ // no cid or cid is blank
        if(nameToConcept.hasOwnProperty(firstRow[indexVariableName])){ // checks nameToConcept (concept library varToConcept.json) and checks if the current question text exists
            firstRowJSON['conceptId'] = nameToConcept[firstRow[indexVariableName]] // assign concept Id from varToConcept.json
            if(!conceptIdList.includes(firstRowJSON['conceptId'])){ // if concept id is not found in conceptIdList add to it 
                conceptIdList.push(firstRowJSON['conceptId'])
            }
            
        }
        else{ // if concept id is not found in varToConcept.json
            if (!isDeprecated) {
             firstRowJSON['conceptId'] = generateRandomUUID(conceptIdList); // prevent generation if deprecation found in firstRow
             conceptIdList.push(firstRowJSON['conceptId'])
                console.log("Goes here")
                nameToConcept[firstRow[indexVariableName]] = firstRowJSON['conceptId']   
             }
        }
    }

    firstRow[conceptIdReverseLookup['Current Question Text']] = firstRowJSON['conceptId'] // adds concept Id to the first row (ADD conditional here?)

    //find sources first
    let conceptColNames = Object.keys(conceptIdReverseLookup) // All column names with concept Ids, conceptColNames = ['Primary Source', 'Secondary Source', 'Source Question', 'Question Text', 'Format/Value']
    for(let i = 0; i < conceptColNames.length; i++){ // THIS LOOP IS RESPONSIBLE FOR ALSO ADDING TO CONCEPT ID LIST TXT FILE
        if(conceptColNames[i].indexOf('Source') != -1 && firstRow[conceptIdReverseLookup[conceptColNames[i]] + 1] != ''){ // second condiiton checcks the cell next to concept Id for source text

            for(let k = 0; k < cluster.length; k++){
                // if (cluster[k].includes('Deprecated')) break; // IS THIS CONTINUE NEEDED?
                // if (cluster[k].includes('Deprecated')) continue; // IS THIS CONTINUE NEEDED?
                // console.log("Is cluser k deprecated",cluster[k].includes('Deprecated'), k)
                if(cluster[k][conceptIdReverseLookup[conceptColNames[i]] + 1] != ""){ // source q text is not empty
                    // console.log("TEST Cluster k",cluster[k]) // Debugging
                    let currId = cluster[k][conceptIdReverseLookup[conceptColNames[i]]]; // current concept Id
                    let currVarName = cluster[k][[conceptIdReverseLookup[conceptColNames[i]] + 1]] // current source question text*
                    if(currId == '' && nameToConcept.hasOwnProperty(currVarName)){ // assign concept id to empty concept if source question text exists in varToConcept.json
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
                        else if(currId == '' && currVarName == currJSON['Current Question Text']){
                            found = i;
                            currId = currJSON['conceptId'];
                            if(!currJSON['subcollections'].includes(firstRowJSON['conceptId'] + '.json')){
                                currJSON['subcollections'].push(firstRowJSON['conceptId'] + '.json')
                            }
                            j = sourceJSONS.length
                        }
                    }
                    if (cluster[k].includes('Deprecated')) continue;
                    if(found == -1){ // NOT found in sourceJSONS, create individual JSON file with concept Id, source question text, and subcollections
                        let newJSON = {}
                        if(currId == '' ){
                            currId = generateRandomUUID(conceptIdList);
                        }
                        
                        newJSON['conceptId'] = currId;
                        newJSON['Current Question Text'] = currVarName;
                        newJSON['subcollections'] = [firstRowJSON['conceptId'] + '.json']
                        sourceJSONS.push(newJSON) // add to sourceJSONS
                    }
                    // console.log("Test deprecation looping",cluster[k][deprecatedNewRevisedIndex])
                    // IMPORTANT: Condition to prevent deprecation for Source Question Text
                    if (!isDeprecated) {
                        nameToConcept[currVarName] = currId // adds to varToConcept.json (TODO: Add conditional to prevent deprecation)
                    }
                    // console.log("nameToConcept TEST!", nameToConcept)
                    console.log("currId looping", currId)
                    if(!conceptIdList.includes(currId)){ // Adds concept Id to conceptIdList
                        conceptIdList.push(currId)
                    }
                
                    if(k > 0){ // cluster length
                        if(!Array.isArray(firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]])){ // text of source is not an array
                            firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]] = [firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]]] // text of source in header array
                            firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]].push(currId + '.json') // add "conceptId.json" to firstRowJSON
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
    console.log("nonEmpty", nonEmpty) // Debugging
    for(let j = 0; j < nonEmpty.length; j++){ // TODO: explore this later buy adding another row with responses, UPDATE: All cell indices with values 
        // console.log("nonEmpty", nonEmpty, nonEmpty.length)
        let currIndex = nonEmpty[j]
        let nonEmptyIndex = currIndex;
        let currCol = [];
        let leafObj = {};
        let isCurrRowDeprecated;
        for(let i = 0; i < cluster.length; i++){
            let currRow = cluster[i];
            // console.log("Non empty currRow", currRow)
            isCurrRowDeprecated = currRow.includes('Deprecated'); 
            // console.log("🚀 ~ isCurrRowDeprecated:", isCurrRowDeprecated)
            if (isCurrRowDeprecated) continue;
            if(currIndex < currRow.length) {
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
                        if(found == false) {
                            jsonList.push({'conceptId':cid, 'Current Question Text':val})
                            fs.writeFileSync('./jsons/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Current Question Text':val},null, 2))
                            // if (!isDeprecated) {
                                nameToConcept[val] = cid
                            // }
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
                            //!isCurrRowDeprecated
                            jsonList.push({'conceptId':cid, 'Current Question Text':currElement})
                            fs.writeFileSync('./jsons/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Current Question Text':currElement},null, 2))
                            // console.log("test current format value",nameToConcept[currElement])
                            // if (!isDeprecated) { // for Current/Format Value?
                                console.log("found false is not deprecated")
                                nameToConcept[currElement] = cid
                            // }
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
    // console.log("Object.keys(conceptIdObject)", Object.keys(conceptIdObject)) // mainly for format values
    for(let i  = 0; i < Object.keys(conceptIdObject).length; i++){ // loop through conceptIdObject, Ex. {2: 'Primary Source', 4: 'Secondary Source', 6: 'Current Source Question', 13: '
        
        let key = parseInt(Object.keys(conceptIdObject)[i]) + 1
        let val = conceptIdObject[key-1]

        if(!(val.includes('Source') || 
            val.includes('Src') || 
            val.includes('Current Question Text') || 
            val.includes('Connect Value for Select all that apply questions') || 
            nonEmpty.includes(key) || 
            !firstRow[key].match(regexInclude)) && firstRow[key] != ''){

                // console.log(val)
                // console.log(firstRow[key])
                
                let currVal = firstRow[key]
                let elementNumber = -1;
                let equalFound = false;
                if(currVal.indexOf('=') != -1){ // find "=" in current Format Value
                    let currElement = currVal;
                    currVal = currElement.split('=')[1].trim()
                    elementNumber = currElement.split('=')[0].trim()
                    equalFound = true;
                }
                let cid = generateRandomUUID(conceptIdList)
                if(nameToConcept.hasOwnProperty(currVal)){ // add to nameToConcept
                    cid = nameToConcept[currVal]
                }
                if(firstRow[key - 1] != ''){ // assigns concept Id to the previous cell if it is not empty
                    cid = firstRow[key-1];
                }
                
                let found = false;
                for(let k = 0; k < jsonList.length; k++){ // find if concept Id exists in jsonList, Note jsonList is an empty array in the beginning of the function
                    if(jsonList[k].hasOwnProperty('conceptId') && jsonList[k]['conceptId'] == cid){
                        console.log("Did it find the concept Id? Found true",jsonList[k]['conceptId'])
                        found = true;
                    }
                }
                if(found == false){
                    console.log("not found in jsonList~~~~~~~~", found, cid)
                    if (!isDeprecated) {
                    jsonList.push({'conceptId':cid, 'Current Question Text':currVal})
                    fs.writeFileSync('./jsons/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Current Question Text':currVal},null, 2)) // current question text
                        nameToConcept[currVal] = cid // Possible place to ignore it being added to varToConcept.json
                    }
                }
                if(!conceptIdList.includes(cid)){ // add to conceptIdList
                    conceptIdList.push(cid)
                }
                firstRow[key-1] = cid // assigns cid to the previous cell
                if(equalFound){ // Add Current Format Value to firstRowJSON, Ex. { "661871565.json": "0" }
                    firstRowJSON[val] = {};
                    firstRowJSON[val][cid + '.json'] = elementNumber;
                }
                else{
                    firstRowJSON[val] = cid + '.json';
            }
        }
    }

    if(cluster[0][conceptIdReverseLookup['Current Question Text']] == ''){ // Current Question Text is empty
        // add somewhere here to prevent deprecation here?
        firstRowJSON['conceptId'] = generateRandomUUID(conceptIdList);
        if(nameToConcept.hasOwnProperty(firstRowJSON[header[indexVariableName]])){
            firstRowJSON['conceptId'] = nameToConcept[firstRowJSON[header[indexVariableName]]];
        }
        cluster[0][conceptIdReverseLookup['Current Question Text']] = firstRowJSON['conceptId'] // reassign to cluster conceptId
        nameToConcept[firstRowJSON[header[indexVariableName]]] = firstRowJSON['conceptId'] // reassign to nameToConcept/ varToConcept.json reference
    }
    else{
        firstRowJSON['conceptId'] = cluster[0][conceptIdReverseLookup['Current Question Text']]
        // add condition to prevent nameToConcept to get deprecated cid
        // firstRowJSON['Deprecated, New, or Revised'] == 'Deprecated'; make sure unexpected overwriting ???
        if (!isDeprecated) {
            nameToConcept[firstRowJSON[header[indexVariableName]]] = firstRowJSON['conceptId']
        }
    }
    // console.log("NAME TO CONCEPT VALUES", nameToConcept)
    let firstRowJSONFound = findJSON(jsonList, firstRowJSON['Current Question Text']); // find JSON in jsonList
    // console.log("🚀 ~ firstRowJSONFound:", firstRowJSONFound)
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
    // PLACE TO TEST DEPRECATION CONDITIONALITY
    // gets rid of first row json
    // TEST with other Rows later on
    // const deprecatedNewRevisedValue = firstRowJSON['Deprecated, New, or Revised'];

    // console.log("firstRowJSON['Deprecated, New, or Revised'].includes('Deprecated')", !firstRowJSON['Deprecated, New, or Revised']?.includes('Deprecated'), firstRowJSON['Deprecated, New, or Revised'])
    // console.log("!!!",typeof deprecatedNewRevisedValue, deprecatedNewRevisedValue)
    const isValidType = (typeof deprecatedNewRevisedValue === 'string' && deprecatedNewRevisedValue !== 'Deprecated') ||
    (Array.isArray(deprecatedNewRevisedValue) && !deprecatedNewRevisedValue.includes('Deprecated'));

    if (isValidType) {
        console.log(isValidType, typeof deprecatedNewRevisedValue, deprecatedNewRevisedValue)
    jsonList.push(firstRowJSON);
    console.log("first row json", firstRowJSON);
    fs.writeFileSync(
        `./jsons/${firstRowJSON['conceptId']}.json`,
        JSON.stringify(firstRowJSON, null, 2)
    );
    }
    // if (typeof firstRowJSON['Deprecated, New, or Revised'] === 'string' && firstRowJSON['Deprecated, New, or Revised'] !== 'Deprecated') {

    //     jsonList.push(firstRowJSON);
    //     console.log("first row json",firstRowJSON)
    //     fs.writeFileSync('./jsons/' + firstRowJSON['conceptId'] + '.json', JSON.stringify(firstRowJSON,null, 2))
    // }

    // if (Array.isArray(firstRowJSON['Deprecated, New, or Revised']) && !firstRowJSON['Deprecated, New, or Revised'].includes('Deprecated')) {
    //     jsonList.push(firstRowJSON);
    //     console.log("first row json",firstRowJSON)
    //     fs.writeFileSync('./jsons/' + firstRowJSON['conceptId'] + '.json', JSON.stringify(firstRowJSON,null, 2))
    // }
    return cluster;

};

function findJSON(jsonList, questionText){
    //console.log('finding: ' + questionText)
    for(let i = 0; i < jsonList.length;i++){
        let json = jsonList[i];
        if(json['Current Question Text'] == questionText){
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

async function readFile(fileName){
    let jsonList = []
    let sourceJSONS = []
    // fs.readdirSync('./jsons/').forEach(file => {
        /*if(file.match(/[0-9]{9}.json/)){
            let currFileContents = fs.readFileSync('./jsons/' + file);
            let currJSON = JSON.parse(currFileContents)
            sourceJSONS.push(currJSON);
        }*/
    // });
    let ConceptIndex = '{}'
    if(fs.existsSync('./jsons/varToConcept.json')){
        ConceptIndex = fs.readFileSync('./jsons/varToConcept.json', {encoding:'utf8'})
    }
    let toReplace = fs.readFileSync(fileName,{encoding:'utf8', flag:'r'})
    ////console.log(toReplace)
    toReplace = toReplace.replace(/�/g, "\"")
    toReplace = toReplace.replace(/¬Æ/g, "®")
    toReplace = toReplace.replace(/√®/g, "è")
    toReplace = toReplace.replace(/‚Äú/g, "“") 
    toReplace = toReplace.replace(/‚Äù/g, "”")
    toReplace = toReplace.replace(/‚Ä¶/g, "…")

    toReplace = toReplace.replace(/Ã¨/g, "è")
    toReplace = toReplace.replace(/Â/g, "")
    toReplace = toReplace.replace(/â€¦/g, "…")
    toReplace = toReplace.replace(/â€/g, "”")
    toReplace = toReplace.replace(/â€œ/g, "“")
    toReplace = toReplace.replace(/â€™/g,"’")
    toReplace = toReplace.replace(/â€”/g,"—")
    toReplace = toReplace.replace(/â„¢/g,"™")
    toReplace = toReplace.replace(/‚Ñ¢/g,"™")
    toReplace = toReplace.replace(/‚Äî/g,"—")
    toReplace = toReplace.replace(/‚Äô/g,"’")


    toReplace = replaceQuotes(toReplace)
    fs.writeFileSync(fileName, toReplace)
    let idIndex = '[]'
    if(fs.existsSync('./jsons/conceptIds.txt')){
        idIndex = fs.readFileSync('./jsons/conceptIds.txt', {encoding:'utf8'})
    }
    let conceptIdList = JSON.parse(idIndex)
    // console.log("🚀 ~ readFile ~ conceptIdList:", conceptIdList, conceptIdList[conceptIdList.length-1])
    let varLabelIndex = 0;
    let cluster = []
    
    const fileStream = fs.createReadStream(fileName);
    const outFile = 'prelude1Concept1.csv'
    let excelOutput = []
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })
    let first = true;
    let second  = true;
    let currCluster = false;
    let header = [];
    let conceptCols = [];
    let conceptIdObject = {};
    let nameToConcept = JSON.parse(ConceptIndex);
    for await(const line of rl){
        //let arr = line.split(',');
        let arr = CSVToArray(line, ',')
        if(first){
            conceptIdObject = getConceptIdCols(arr)
            console.log('abc')
            console.log(conceptIdObject)
            header = arr;
            first = false;
            for(let i = 0; i < arr.length; i++){
                if(arr[i] == "Current Question Text"){
                    varLabelIndex = i;
                }
                if(arr[i] == "conceptId" && i+1 < arr.length){
                    conceptCols.push(i+1)
                }
            }
            excelOutput.push([arr])
        }
        else if(currCluster){
            if(arr[varLabelIndex] == ''){ // used for multiple format/value 
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
    // console.log("This is the cluster", cluster) // Add back for debugging
    let returned = processCluster(cluster, header, nameToConcept, varLabelIndex, conceptIdList, conceptIdObject, sourceJSONS, jsonList,/[0-9]+\s*=/);
    excelOutput.push(returned) // this is where the rows are added to the excelOutput
    // console.log("sourceJSONS length",sourceJSONS.length, "sourceJSONS", sourceJSONS)
    // console.log("current JSONList", jsonList) // UNWANTED SIDE EFFECT HERE! getting added to the list without
    // filter jsonList
    jsonList = jsonList.filter( currJSON => {
        return !currJSON['Deprecated, New, or Revised']?.includes('Deprecated');
    })
    // console.log("current JSONList after filter", jsonList)

    for(let i = 0; i < sourceJSONS.length; i++){ // check jsonList and push sourceJSONS to it if not found
        let found = false;
        let result = {};
        for(let j = 0; j < jsonList.length; j++){
            let currJ = jsonList[j];
            let currS = sourceJSONS[i];
            if(currJ.conceptId == currS.conceptId){ // compared concept Ids of sourceJSONS and jsonList
                
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
                if(currJ.conceptId == "289664241"){
                    //console.log(result)
                }
                found = true;
                jsonList[j] = result
            }
        }   
        if(!found){
            console.log('not found jsonList push')
            jsonList.push(sourceJSONS[i])
            fs.writeFileSync('./jsons/' + sourceJSONS[i]['conceptId'] + '.json', JSON.stringify(sourceJSONS[i],null, 2));

        }
        else{
            console.log('found jsonList push')
            fs.writeFileSync('./jsons/' + sourceJSONS[i]['conceptId'] + '.json', JSON.stringify(result,null, 2))
        }
        
    }
    console.log('nameToConcept output!', nameToConcept) // Output of nameToConcept added to varToConcept.json []
    console.log('conceptIdList output!', conceptIdList, "last conceptIdList", conceptIdList[conceptIdList.length-1]) // Output of conceptIdList added to conceptIds.txt []
    // temp comment out
    fs.writeFileSync('./jsons/varToConcept.json', JSON.stringify(nameToConcept)) // Write to concept library at the End
    fs.writeFileSync('./jsons/conceptIds.txt', JSON.stringify(conceptIdList))
    rl.close();
    fileStream.close();
    let toPrint = '';
    for(let i=0; i < excelOutput.length; i++){
        let cluster = excelOutput[i]
        for(let j = 0; j < cluster.length; j++){
            let row = cluster[j]
            toPrint += cluster[j].map(function(value){
                if(value.indexOf(',') != -1){
                    return "\"" + value + "\"";
                }
                else{
                    return value;
                }
            }).join(",");
            if(i!=excelOutput.length-1 || j!=cluster.length -1){
                toPrint += '\n'
            }
        }
    }
    fs.writeFileSync(fileName, toPrint)
    let timestamp = new Date().toISOString().split('.')[0].replace(/:/g, '-').replace('T', '-');
    let filenameOutside = './csvHistory/Quest-' + timestamp + '_Concept_Id_Dict.csv';
    let filenameVarGen = './csvHistory/Quest-' + timestamp + '_Concept_ID_Gen.json'
    fs.writeFileSync(filenameVarGen,JSON.stringify(nameToConcept,null, 2)) 
    fs.writeFileSync(filenameOutside,toPrint)
    // Temporarily commented out for testing
}

module.exports = {
    readFile:readFile
}