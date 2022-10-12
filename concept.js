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

function generateNine(){ // Generate nine digit number, first number must be 1 - 9 and other proceeding numbers will be 0 - 9
    let a = ''
    a += Math.floor(Math.random()*9 + 1)
    for(let i = 1; i < 9; i++){
        let b = Math.floor(Math.random()*10)
        a += b
    }
    return a;
}

function generateRandomUUID(conceptIdList){ // continue to create unique 9 digit number until generated 9 digit number not found in --> conceptIdList
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
 * processCluster for the current row as a readable streamline file
 * @param {array} cluster - current row after header row
 * @param {array} header - header items of the first row
 * @param {object} nameToConcept - varToConcept object library mapping
 * @param {number} indexVariableName - conceptId index location before question Text
 * @param {object} conceptIdList - object type array from conceptIds.txt file
 * @param {object} conceptIdObject - object mapping of conceptId index value to next header string value (Ex. '2': 'Primary Source')
 * @param {array} sourceJSONS - array of objects from each individual concept id json
 * @param {array} jsonList - empty array []
 * @param {string} regexInclude - regex string /[0-9]+\s*=/
 *  


 */

function processCluster(cluster, header, nameToConcept, indexVariableName, conceptIdList, conceptIdObject, sourceJSONS, jsonList, regexInclude){
    //console.log(cluster[0])
    let nonEmpty = [];
    let conceptIdObjectKeys = Object.keys(conceptIdObject)
    let conceptIdIndices = [];
    let generalId = -1;
    let conceptIdReverseLookup = {};
    console.log("conceptIdObjectKeys", conceptIdObjectKeys)
    /* START HERE */
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
                        if(found == false){
                            jsonList.push({'conceptId':cid, 'Question Text':val})
                            // fs.writeFileSync('./jsons/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Question Text':val},null, 2))
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
                            // fs.writeFileSync('./jsons/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Question Text':currElement},null, 2))
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
            console.log(val)
            console.log(firstRow[key])
            
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
                // fs.writeFileSync('./jsons/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Question Text':currVal},null, 2))
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
    // fs.writeFileSync('./jsons/' + firstRowJSON['conceptId'] + '.json', JSON.stringify(firstRowJSON,null, 2))
    console.log("cluster",cluster)

}

function findJSON(jsonList, questionText){ // loop entire jsonList, find match between question Text of param1 and param2, return json 
    //console.log('finding: ' + questionText)
    for(let i = 0; i < jsonList.length;i++){
        let json = jsonList[i];
        if(json['Question Text'] == questionText){
            return json;
        }
    }
    return undefined;
}

function CSVToArray(strData){ // Takes current row as a string, returns an array
    let orig = strData; // Not needed anymore?
    strData = strData.trim(); 
    let arr = []; // info from toPush variable
    let finalPush = true;
    let num = 0 // added to see current count
    while(strData.indexOf(",") != -1 ){ // searches inside current string for comma
        
        // console.log("test \"", num,strData.indexOf(","), strData, strData.substring(0,1) == "\"")
        let toPush = ""; // each loop is new toPush value
        if(strData.substring(0,1) == "\""){ // check first character for quote chracter
            // console.log("For thy quotes!")
            strData = strData.substring(1); // all characters after quote " (first quote doesn't count)     
            // console.log("strData", strData)
            let nextLook = strData.indexOf('\"\"') // index - double quotes "" (must be double quotes)
            let nextQuote = strData.indexOf('\"'); // index - single quote " "
            // console.log(num ,"nextLook,nextQuote",nextLook,nextQuote)
            let numQuotes = 0 
            while(nextLook != -1 && nextLook == nextQuote){ // pushes from start to end of "\"\"
                ////console.log(nextLook)
                toPush += strData.substring(0,nextLook) + '\"\"' // pushes only double quotes; (0,nextLook) is empty string no value + "" --> ""
                // console.log("toPush 1", toPush)
                strData = strData.substring(strData.indexOf("\"\"") + 2);   // reassign to all text after double quotes 
                if(orig.includes('Ever took hormones to reflect your gender')){
                    ////console.log(strData.substring(strData.indexOf("\"\"") + 2));
                    ////console.log('------------------------')
                }
                // console.log("before",nextLook,nextQuote, strData)
                nextLook = strData.indexOf('\"\"') // get index of first quote
                nextQuote = strData.indexOf('\"');
                // console.log("after",nextLook,nextQuote, strData)
                numQuotes++
                // console.log("numQuotes",numQuotes)
            }

            // console.log("toPush",strData.substring(0,strData.indexOf("\"")))

            toPush += strData.substring(0,  strData.indexOf("\""));    
            strData = strData.substring(strData.indexOf("\"") + 1);
            if(orig.includes('Ever took hormones to reflect your gender')){
                ////console.log(strData.substring(strData.indexOf("\"") + 1));
                ////console.log('------------------------')
            }
            strData = strData.substring(strData.indexOf(',')+1) // all text after comma
            if(strData.trim() == ''){
                finalPush = false
            }
        }
        else{
            toPush = strData.substring(0, strData.indexOf(',')); // push from start of strData up to next comma ("," not included); Note: strData.indexOf(',') is 0 if current value is comma
            // console.log(num, toPush,"strDATA",strData)
            strData = strData.substring(strData.indexOf(',') + 1) // reassign strData to start at next "," occurence (not including comma) by increasing indexOf value
            // console.log("strData toPush", strData.indexOf(','),toPush)
        }
        // console.log('toPush',toPush,num)
        arr.push(toPush.trim())
        //let nextQuote = strData.indexOf("\"")
        num ++
    }
    if(finalPush == true){ // strData val gets reassigned, so last becomes nothing
        // console.log("final push ,arr", arr,"strData", strData)
        arr.push(strData.trim());
    }

    // Return the parsed data.
    return( arr );
}

function getConceptIdCols(header){ // pushing object of headers with concept Ids
    // console.log("header",header)
    let toReturn = {}
    for(let i = 0; i < header.length;i++){
        if(header[i] == 'conceptId'){
            // console.log("header conceptId",i,header[i])
            if(i + 1 < header.length && header[i+1] != 'conceptId'){ // check header after concept Id; concept Id before column header
                // console.log("header after", header[i+1])
                toReturn[i] = header[i+1]; // Ex. {'2': 'Primary Source',}
            }
            else{
                console.error('Header Error (conceptIds not in correct place)')
            }
            
        }
    }
    // console.log(toReturn)
    return toReturn
    
}

async function readFile(fileName){ // MAIN FUNCTION STARTS HERE ********************************************************************************
    let jsonList = []
    let sourceJSONS = []
    // fs.readdirSync('./jsons/').forEach(file => {
    //     if(file.match(/[0-9]{9}.json/)){
    //         let currFileContents = fs.readFileSync('./jsons/' + file);
    //         // console.log("currFileContents", currFileContents)
    //         let currJSON = JSON.parse(currFileContents)
    //         // console.log("currJSON",file,currJSON)
    //         sourceJSONS.push(currJSON);
    //     }
    // });

    fs.readdirSync('./jsonsTest/').forEach(file => { // jsonsTest Folder (TEST FILE READ)
        if(file.match(/[0-9]{9}.json/)){
            let currFileContents = fs.readFileSync('./jsons/' + file);
            // console.log("currFileContents", currFileContents)
            let currJSON = JSON.parse(currFileContents)
            // console.log("currJSON",file,currJSON)
            sourceJSONS.push(currJSON);
        }
    });
    console.log('sourceJSONS value', sourceJSONS)

    let ConceptIndex = '{}' // becomes varToConcept.json list (FOUND), {} (NOT FOUND)
    /* Add back origin varToConcept.json */
    // if(fs.existsSync('./jsons/varToConcept.json')){                 /*  USES / READS --> VARTOCONCEPT.JSON LIBRARY!!!!!  */
    //     ConceptIndex = fs.readFileSync('./jsons/varToConcept.json', {encoding:'utf8'})
    // }
    if(fs.existsSync('./jsons/varToConceptTest.json')){
        ConceptIndex = fs.readFileSync('./jsons/varToConceptTest.json', {encoding:'utf8'}) // MAKE CHANGES TO LIBRARY FOR TESTING 
    }
    console.log("ConceptIndex!!!", typeof ConceptIndex, typeof JSON.parse(ConceptIndex), JSON.parse(ConceptIndex))
    let toReplace = fs.readFileSync(fileName,{encoding:'utf8', flag:'r'})

    // console.log("toReplace",typeof toReplace) // entire string csv file

    toReplace = toReplace.replace(/�/g, "\"")
    
    // toReplace = toReplace.replace(/¬Æ/g, "®")
    // toReplace = toReplace.replace(/√®/g, "è")
    // toReplace = toReplace.replace(/‚Ä¶/g, "…")
    toReplace = replaceQuotes(toReplace) // replaceQuotes has no affect
    fs.writeFileSync(fileName, toReplace) // rewrite fileName with regex conditions
    let idIndex = '[]'
    /* Add back origin conceptIds.txt */
    // if(fs.existsSync('./jsons/conceptIds.txt')){
    //     idIndex = fs.readFileSync('./jsons/conceptIds.txt', {encoding:'utf8'}) // Array of concept Ids (string) (Note: purpose of the string array of strings '['...','...',....]'
    // }
    if(fs.existsSync('./jsons/conceptIdsTest.txt')){
            idIndex = fs.readFileSync('./jsons/conceptIdsTest.txt', {encoding:'utf8'}) // Array of concept Ids (string) (Note: purpose of the string array of strings '['...','...',....]'
        }

    let conceptIdList = JSON.parse(idIndex) // Array of concept Ids (list of string concepts)
    let varLabelIndex = 0; // reassigns to the index location of Question Text
    let cluster = []

    /*------------------------------------------------------------ CHECKPOINT 1 ------------------------------------------------------------ */

    const fileStream = fs.createReadStream(fileName); // opens up file/stream and read data (all of it!)

    // console.log("fileStream",typeof fileStream)

    // fileStream.on('data',(chunk) => {
    //     console.log("chunk",typeof chunk.toString())
    //     console.log("chunk",chunk.toString())
    // })

    
    /* START COMMENT HERE */
    const outFile = 'prelude1Concept1.csv'
    let excelOutput = [] // [ [ [] ] ]; array nested 2 layers
    const rl = readline.createInterface({ // readline - interface for reading data from a readable stream
        input: fileStream,
        crlfDelay: Infinity // crlfDelay - recognize all instances of CR LF from fileStream as a single line break
    })

    let first = true;
    let second  = true;
    let currCluster = false;
    let header = [];
    let conceptCols = []; // concept Columns will be here
    let conceptIdObject = {};
    let nameToConcept = JSON.parse(ConceptIndex); // varToConcept Library 
    

    // rl.on('line', (input) => {
    //     console.log(typeof `${input}`, input);
    // });

    let numCounter = 0
    for await(const line of rl){ // handle promise based value --> each line from rl will be read as a single line
        // CSVToArray(',') extra paramater not needed
        // console.log("line",typeof line,line)
        let arr = CSVToArray(line, ',')
        // console.log("arr", arr)
/*------------------------------------------------------------ (CHECKPOINT 2 - Looping through curremt row array, push to cluster array )------------------------------------------------------------ */
        if(first){
            conceptIdObject = getConceptIdCols(arr)
            // console.log('abc')
            console.log("conceptIdObject",conceptIdObject)
            header = arr; // array of string items
            // console.log("header",header)
            first = false; // reassign, only used for top header
            for(let i = 0; i < arr.length; i++){
                if(arr[i] == "Question Text"){
                    varLabelIndex = i; // reassign varLabelIndex with index of Question Text!
                    // console.log("varLabelIndex" , i)
                }
                if(arr[i] == "conceptId" && i+1 < arr.length){ // arr loop length control 
                    conceptCols.push(i+1) // push all conceptCols
                }
            }
            // console.log("conceptCols" , conceptCols)
            // console.log("arr",arr)
            excelOutput.push([arr])
            // console.log("excelOutput", excelOutput)
        }
        else if(currCluster){ // conditional for the rows 3 and onwards
            // console.log("currCluster!, arr, varLabelIndex",currCluster, arr, varLabelIndex)
            if(arr[varLabelIndex] == ''){ // empty question text cell path, push curr row arr 
                cluster.push(arr);
            }
            else{ 
                // console.log("cluster val rows 3 and beyond!, conditional block from currCluster flag", cluster)
                // console.log("header", header)
                // console.log("nameToConcept",typeof nameToConcept, nameToConcept)
                // console.log("varLabelIndex",typeof varLabelIndex, varLabelIndex)
                // console.log("conceptIdList",typeof conceptIdList, conceptIdList)
                // console.log("conceptIdObject", typeof conceptIdObject,conceptIdObject )
                // console.log("sourceJSONS",typeof sourceJSONS, sourceJSONS )
                // console.log("jsonList",typeof jsonList, jsonList )
                
                let returned = processCluster(cluster, header, nameToConcept, varLabelIndex, conceptIdList, conceptIdObject, sourceJSONS, jsonList, /[0-9]+\s*=/)
                // excelOutput.push(returned)
                cluster = [arr]
                currCluster = true;
            }
        }
        else{ // row after header switches currCluster boolean state, why?
            // console.log("cluster push arr", numCounter,arr)
            cluster.push(arr)
            // console.log("cluster push arr", cluster)
            currCluster = true;
        }
        numCounter++
    }
    
    // // GO TO processCluster
    // let returned = processCluster(cluster, header, nameToConcept, varLabelIndex, conceptIdList, conceptIdObject, sourceJSONS, jsonList,/[0-9]+\s*=/);
    // excelOutput.push(returned)
    // //console.log(sourceJSONS)
    // for(let i = 0; i < sourceJSONS.length; i++){
    //     let found = false;
    //     let result = {};
    //     for(let j = 0; j < jsonList.length; j++){
    //         let currJ = jsonList[j];
    //         let currS = sourceJSONS[i];
    //         if(currJ.conceptId == currS.conceptId){
                
    //             let key;

    //             for (key in currS) {
    //                 if(currS.hasOwnProperty(key)){
    //                     result[key] = currS[key];
    //                 }
    //             }

    //             for (key in currJ) {
    //                 if(currJ.hasOwnProperty(key)){
    //                     result[key] = currJ[key];
                        
    //                 }
    //             }
    //             if(currJ.conceptId == "289664241"){
    //                 //console.log(result)
    //             }
    //             found = true;
    //             jsonList[j] = result
    //         }
    //     }   
    //     if(!found){
    //         jsonList.push(sourceJSONS[i])
    //         fs.writeFileSync('./jsons/' + sourceJSONS[i]['conceptId'] + '.json', JSON.stringify(sourceJSONS[i],null, 2));

    //     }
    //     else{
    //         fs.writeFileSync('./jsons/' + sourceJSONS[i]['conceptId'] + '.json', JSON.stringify(result,null, 2))
    //     }
        
    // }
    // fs.writeFileSync('./jsons/varToConcept.json', JSON.stringify(nameToConcept))
    // fs.writeFileSync('./jsons/conceptIds.txt', JSON.stringify(conceptIdList))
    // rl.close();
    // fileStream.close();
    // let toPrint = '';
    // for(let i=0; i < excelOutput.length; i++){
    //     let cluster = excelOutput[i]
    //     for(let j = 0; j < cluster.length; j++){
    //         let row = cluster[j]
    //         toPrint += cluster[j].map(function(value){
    //             if(value.indexOf(',') != -1){
    //                 return "\"" + value + "\"";
    //             }
    //             else{
    //                 return value;
    //             }
    //         }).join(",");
    //         if(i!=excelOutput.length-1 || j!=cluster.length -1){
    //             toPrint += '\n'
    //         }
    //     }
    // }
    // fs.writeFileSync(fileName, toPrint)
    // let timestamp = new Date().toISOString().split('.')[0].replace(/:/g, '-').replace('T', '-');
    // let filenameOutside = './csvHistory/Quest-' + timestamp + '_Concept_Id_Dict.csv';
    // let filenameVarGen = './csvHistory/Quest-' + timestamp + '_Concept_ID_Gen.json'
    // fs.writeFileSync(filenameVarGen,JSON.stringify(nameToConcept,null, 2))
    // fs.writeFileSync(filenameOutside,toPrint)
    
    /* END COMMENT HERE */
}

module.exports = {
    readFile:readFile
}
