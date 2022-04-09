# conceptGithubActions

# Description
This tool is used to reconcile Excel representations of concepts with JSON representations. The tool takes in the Excel (.xlsx) file when it is updated in the repository, creates concept ids for concepts that need them, and creates the JSON files with representations of the concept ids.

# Usage
Just push changes to the excel file and the Github Action will begin running automatically. The webtool linked below is an easy way to see the different concepts and concept ids created by the program.

# Spreadsheet Rules
The program will look only at the sheet named MasterFile within the excel file being updated.  
Below is an example of a spreadsheet defining concepts

| conceptId | Source Animal Type | conceptId | Variable Name | Description | conceptId | Location | 
| --------------- | --------------- | --------------- | --------------- | --------------- | --------------- | --------------- |
| 125412523 | Bird | | Robin | Orange tummy | | North America |
| | | | | | | Europe |
| | Bird | | Sparrow | Brown | | |
| | | | | Small | | |
| | Reptile |  | Snake | Does not have many teeth | | |
| | Reptile |  | Crocodile | Has many teeth | | |

First, the program will group the file by Variable Names
* The header "Variable Name" is a special header. It indicates a concept that needs a conceptId assigned to it.
* In cases where the Variable Name field is empty, the current row will be grouped with the cluster above it
  * These are to allow arrays to be represented in the excel file
* For example, rows 2 and 3 in the above table will be clustered together, leading to something along the lines of  
```
{
  "Source Animal Type": "Bird"  
  "Variable Name": "Robin"  
  "Description": "Orange Tummy"
  "Location" : ["North America", "Europe"]  
}  
```
**Note that this is before we start assigning concept ids to anything

Now that we have the cluster, the program will begin looking through it to see where it needs to assign concept ids
* Note the "conceptId" columns in the header, these columns will let the code know that we want concept ids to be inserted
* The conceptId column directly next to the "Variable Name" column represents the concept Id for the entire cluster
* All of the other conceptId columns will assign concept ids to the column to the direct right of it

Let us look at the example of the cluster we looked at above

| conceptId | Source Animal Type | conceptId | Variable Name | Description | conceptId | Location | 
| --------------- | --------------- | --------------- | --------------- | --------------- | --------------- | --------------- |
| 125412523 | Bird | | Robin | Orange tummy | | North America |
| | | | | | | Europe |

"Source Animal Type": already has a concept id next to it and is therefore assigned the concept id 125412523

This entire concept of "Robin" is assigned a random concept id that doesn't already exist
* Let's give it 214124124

"Description" does not have a conceptId column next to it, so the program will not assign it concept ids

"Location" has a conceptId column next to it, so the program will assign it concept ids
* Notice as well that there are 2 items in this column within the cluster, so each item in this column will have a concept id assigned to it
* Let's give "North America" 362362632
* Let's give "Europe" 252532612

The program will also create a json for each of these concepts that we are assigning concept ids to

At the end of all this, the program will have added the ids into the corresponding cells

| conceptId | Source Animal Type | conceptId | Variable Name | Description | conceptId | Location | 
| --------------- | --------------- | --------------- | --------------- | --------------- | --------------- | --------------- |
| 125412523 | Bird | 214124124 | Robin | Orange tummy | 362362632 | North America |
| | | | | | 252532612 | Europe |


and generated these jsons for the cluster (or concept):

```
{
    conceptId: 214124124
    "Source Animal Type": "125412523.json"  
    "Variable Name": "Robin"  
    "Description": "Orange Tummy"
    "Location" : ["362362632.json", "252532612.json"]  
}
{
    conceptId: 125412523
    "Variable Name": "Robin"
}
{
    conceptId: 362362632
    "Variable Name": "North America"
}
{
    conceptId: 252532612
    "Variable Name": "Europe"
}
```

Each of these objects will be stored in the jsons folder under the name "jsons/{conceptId}.json" and the spreadsheet will be stored back into the workbook it was read from.


### Web page live @ https://episphere.github.io/conceptGithubActions/web/#conceptId

