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
        if((firstRow[i] != "" && !nonEmpty.includes(i) && !conceptIdIndices.includes(i)) || (conceptIdIndices.includes(i) && conceptIdObject[i] =="Current Question Text")){
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

    firstRow[conceptIdReverseLookup['Current Question Text']] = firstRowJSON['conceptId']

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
                        else if(currId == '' && currVarName == currJSON['Current Question Text']){
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
                        newJSON['Current Question Text'] = currVarName;
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
            // console.log(currRow) // Add back later
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
                            jsonList.push({'conceptId':cid, 'Current Question Text':val})
                            fs.writeFileSync('./jsonsCopy/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Current Question Text':val},null, 2))
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
                            jsonList.push({'conceptId':cid, 'Current Question Text':currElement})
                            fs.writeFileSync('./jsonsCopy/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Current Question Text':currElement},null, 2))
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

        if(!(val.includes('Source') || val.includes('Src') || val.includes('Current Question Text') || val.includes('Connect Value for Select all that apply questions') || nonEmpty.includes(key) || !firstRow[key].match(regexInclude)) && firstRow[key] != ''){
            // console.log(val) // Add back later
            // console.log(firstRow[key]) // Add back later
            
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
                jsonList.push({'conceptId':cid, 'Current Question Text':currVal})
                fs.writeFileSync('./jsonsCopy/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Current Question Text':currVal},null, 2))
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

    if(cluster[0][conceptIdReverseLookup['Current Question Text']] == ''){

        firstRowJSON['conceptId'] = generateRandomUUID(conceptIdList);
        if(nameToConcept.hasOwnProperty(firstRowJSON[header[indexVariableName]])){
            firstRowJSON['conceptId'] = nameToConcept[firstRowJSON[header[indexVariableName]]];
        }
        cluster[0][conceptIdReverseLookup['Current Question Text']] = firstRowJSON['conceptId']
        nameToConcept[firstRowJSON[header[indexVariableName]]] = firstRowJSON['conceptId']
    }
    else{
        firstRowJSON['conceptId'] = cluster[0][conceptIdReverseLookup['Current Question Text']]
        nameToConcept[firstRowJSON[header[indexVariableName]]] = firstRowJSON['conceptId']
    }
    let firstRowJSONFound = findJSON(jsonList, firstRowJSON['Current Question Text']);
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
    fs.writeFileSync('./jsonsCopy/' + firstRowJSON['conceptId'] + '.json', JSON.stringify(firstRowJSON,null, 2))
    return cluster;

}

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

/* 
Main Function Here
// fileName --> './csvCopy/masterFileCopy.csv'
*/ 

async function readFile(fileName){
    let jsonList = []
    let sourceJSONS = []
    fs.readdirSync('./jsonsCopy/').forEach(file => {
        if(file.match(/[0-9]{9}.json/)){
            let currFileContents = fs.readFileSync('./jsons/' + file);
            let currJSON = JSON.parse(currFileContents)
            sourceJSONS.push(currJSON);
        }
    });

    let ConceptIndex = '{}'
    if(fs.existsSync('./jsonsCopy/varToConcept.json')){
        ConceptIndex = fs.readFileSync('./jsonsCopy/varToConcept.json', {encoding:'utf8'})
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


    toReplace = replaceQuotes(toReplace)
    fs.writeFileSync(fileName, toReplace)
    let idIndex = '[]'
    if(fs.existsSync('./jsonsCopy/conceptIds.txt')){
        idIndex = fs.readFileSync('./jsonsCopy/conceptIds.txt', {encoding:'utf8'})
    }
    let conceptIdList = JSON.parse(idIndex)

    /**
     * Current Question Text's conceptId index - 13 (current)
     */
    let currQuestionTextIndex = 0;

    /**
     * cluster
     * for await (const line of rl) looping, arr line pushed in else block
     * 
    */
    let cluster = []
    
    const fileStream = fs.createReadStream(fileName);

    /**
     * excelOutput is an array of arrays. Each array is a row in the excel sheet
    */
    let excelOutput = []
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })
    let first = true;
    let second  = true;
    let currCluster = false; // switches to true on else statement code block
    let header = [];
    /**
     * deprecatedNewRevisedIndex (new variable) - index 10 
    */
    let deprecatedNewRevisedIndex;

    /** 
     * conceptCols is an array of conceptId indices to the right of cidIndex Ex. [3, 5, 7, ...]
     * 3 is the index of conceptId and 'Primary Souce' is the next index after conceptId
    */
    let conceptCols = [];
    /** 
     * object of concepId index and concept name value to the left of it. 
     * 2 is the index of conceptId and 'Primary Souce' is the next index after conceptId Ex. {'2': 'Primary Source', ...}
    */
    let conceptIdObject = {};
    let nameToConcept = JSON.parse(ConceptIndex); // entire './jsonsCopy/varToConcept.json' object
    let counter = 0;
    for await(const line of rl){
        //let arr = line.split(',');
        let arr = CSVToArray(line, ',')
        // console.log("arr", arr) // line by line
        if(first){
            conceptIdObject = getConceptIdCols(arr)
            // console.log('abc') // Add Back Later
            // console.log(conceptIdObject) // Add Back Later
            header = arr;
            first = false;
            for(let i = 0; i < arr.length; i++){
                if(arr[i] == "Current Question Text"){
                    currQuestionTextIndex = i;
                }
                if(arr[i] == "conceptId" && i+1 < arr.length){
                    conceptCols.push(i+1)
                }
                if( arr[i] == "Deprecated, New, or Revised") {
                    deprecatedNewRevisedIndex = i;
                    console.log("🚀 ~ file: conceptCopy.js:603 ~ forawait ~ deprecatedNewRevisedIndex:", deprecatedNewRevisedIndex)
                }
            }
            console.log("currQuestionTextIndex", currQuestionTextIndex)
            excelOutput.push([arr])
            counter++;
        }
        else if(currCluster){ // gets run after 2nd line and onwards...
            // console.log("current currQuestionTextIndex", currQuestionTextIndex, arr[currQuestionTextIndex])
            // Note: Possible to add deprecated value checker here?
            if(arr[currQuestionTextIndex] == ''){
                if(arr[deprecatedNewRevisedIndex] === 'Deprecated'){
                    console.log("TEST else if SKIPPED EXTRA ROWS", arr[deprecatedNewRevisedIndex], `counter: ${counter}`);
                    counter++
                    continue
                }
                console.log("else if counter", counter)
                console.log("------------------")
                console.log("cluster BEFORE ARR added to CLUSTER", counter,cluster)
                cluster.push(arr);
                console.log("🚀 ~ file: conceptCopy.js:625 ~ forawait ~ cluster:",cluster, cluster.length)
                counter++;
            }
            else{
                if(arr[deprecatedNewRevisedIndex] === 'Deprecated'){
                    console.log("TEST else if SKIPPED FIRST ROW AND ALL", arr[deprecatedNewRevisedIndex], `counter:` , counter);
                    counter++
                    continue
                }
                let returned = processCluster(cluster, header, nameToConcept, currQuestionTextIndex, conceptIdList, conceptIdObject, sourceJSONS, jsonList, /[0-9]+\s*=/)
                excelOutput.push(returned)
                console.log("else if counter", counter)
                cluster = [arr]
                console.log("🚀 ~ file: conceptCopy.js:635 ~ forawait ~ cluster:", cluster)
                currCluster = true;
                counter++;
            }
            console.log("else if counter", counter)
        }
        else{ // adds first row after header to cluster
            // Note: Possible to add deprecated value checker here?
            // if(arr[deprecatedNewRevisedIndex] === 'Deprecated'){
            //     console.log("TEST", arr[deprecatedNewRevisedIndex])
            //     continue;
            // }
            cluster.push(arr)
            currCluster = true;
            // console.log("counter else After the Headers are added", counter)
            console.log("counter and cluster", counter, cluster)
            counter++;
        }
    }
    // console.log("FOR LOOP ENDS HERE ------------------")
    // console.log("excelOutput", excelOutput)
    // return
    let returned = processCluster(cluster, header, nameToConcept, currQuestionTextIndex, conceptIdList, conceptIdObject, sourceJSONS, jsonList,/[0-9]+\s*=/);
    // console.log("🚀 ~ file: conceptCopy.js:640 ~ readFile ~ returned:", returned)
    // console.log("cluster END", cluster)
    excelOutput.push(returned)
    
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
                if(currJ.conceptId == "289664241"){
                    //console.log(result)
                }
                found = true;
                jsonList[j] = result
            }
        }   
        if(!found){
            jsonList.push(sourceJSONS[i])
            fs.writeFileSync('./jsonsCopy/' + sourceJSONS[i]['conceptId'] + '.json', JSON.stringify(sourceJSONS[i],null, 2)); // ADD THIS BACK IN

        }
        else{
            fs.writeFileSync('./jsonsCopy/' + sourceJSONS[i]['conceptId'] + '.json', JSON.stringify(result,null, 2)) // ADD THIS BACK IN
        }
        
    }

    fs.writeFileSync('./jsonsCopy/varToConcept.json', JSON.stringify(nameToConcept)) // ADD THIS BACK IN
    fs.writeFileSync('./jsonsCopy/conceptIds.txt', JSON.stringify(conceptIdList)) // ADD THIS BACK IN

    // DELETE "SPECIFIC KEYS FUNCTION CAN BE PLACED HERE"
    fs.readdirSync('./jsonsCopy/').forEach((file, index) => {
        if (file.match(/[0-9]{9}.json/)){
            let currFileContents = fs.readFileSync('./jsonsCopy/' + file);
            let currFileJSON = JSON.parse(currFileContents);

            // read and parse file is above

            // next is to delete the key
            // if(file == "288972510.json") {
                if (currFileJSON['Deprecated, New, or Revised']){
                    console.log("currFileJSON BEFORE deleted version", currFileJSON)
                    delete currFileJSON['Deprecated, New, or Revised'];
                    // console.log("------------------")
                    console.log("currFileJSON AFTER deleted version", currFileJSON)
                }
                if(currFileJSON['Date Deprecated, New, or Revised Variable Pushed to Prod']) {
                    delete currFileJSON['Date Deprecated, New, or Revised Variable Pushed to Prod'];
                }
                let updatedJSONString = JSON.stringify(currFileJSON, null, 2);
                fs.writeFileSync('./jsonsCopy/' + file, updatedJSONString);
            // }

        }   
    });

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

    /* ADD THIS BACK IN */
    fs.writeFileSync(fileName, toPrint) 
    let timestamp = new Date().toISOString().split('.')[0].replace(/:/g, '-').replace('T', '-');
    let filenameOutside = './csvHistoryCopy/Quest-' + timestamp + '_Concept_Id_Dict.csv';
    let filenameVarGen = './csvHistoryCopy/Quest-' + timestamp + '_Concept_ID_Gen.json'
    fs.writeFileSync(filenameVarGen,JSON.stringify(nameToConcept,null, 2))
    fs.writeFileSync(filenameOutside,toPrint)
    
}

module.exports = {
    readFile:readFile
}
