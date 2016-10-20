/**
 *
 * OnInstall method.
 *
 * Necessary for the menu items to populate the first time after the add-on is installed.
 *
 **/
function onInstall(e) {
  onOpen(e);
}

/**
 *
 * Toolbar menu creation.
 *
 * Called on worbook opening.
 *
 **/
function onOpen() {
    SpreadsheetApp.getUi()
        .createAddonMenu()
        .addItem('Start a new translation', 'showSidebar')
        .addItem('About', 'showAbout')
        .addToUi();
}

/*
* Example function for Google Analytics Measurement Protocol.
* @param {string} tid Tracking ID / Web Property ID
* @param {string} url Document location URL
*/
function sendGAMP(tid, url){
  var data = {'v': '1',
                 'tid': tid,
                 'cid': Utilities.getUuid(),
                 'z': Math.floor(Math.random()*10E7),
                 't':'pageview',
                 'dl': url };
  var payload = Object.keys(data).map(function(key) {
                                        return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
                                    }).join('&');
  var options = {'method' : 'POST',
                 'payload' : payload };
  
  UrlFetchApp.fetch('http://www.google-analytics.com/collect', options); 
}

/**
 *
 * Sidebar title, content & size.
 *
 **/
function showSidebar() {
    var html = HtmlService.createHtmlOutputFromFile('index')
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .setTitle('Translate My Sheet')
        .setWidth(300);

    // Open sidebar
    SpreadsheetApp.getUi().showSidebar(html);
}

function showAbout() {
  var html = HtmlService.createHtmlOutputFromFile('about')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle('About')
      .setWidth(250)
      .setHeight(450);
  SpreadsheetApp.getActive().show(html);
}

/**
 *
 * Translate function.
 *
 **/
function translate(radioFull, radioSelected,radioCrazy, radioOgSheet, radioNewSheet, sourceLangage, targetLangage) {
    var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var activeSheet = activeSpreadsheet.getActiveSheet();
    var activeRange = activeSheet.getActiveRange().getA1Notation();
    activeSpreadsheet.toast("Translation in progress...", "", -1);
    try {
        if (radioOgSheet) {
      var targetSheet = activeSheet
    } else if (radioNewSheet) {
      var newName = activeSheet.getName() + " - " + targetLangage;
      if (activeSpreadsheet.getSheetByName(newName)) {
        var sheets = activeSpreadsheet.getSheets();
        var counter = 1;
        for (var i=0; i<sheets.length; i++) {
          if (sheets[i].getName().indexOf(newName) != -1) {
            counter++;
          }
        }
        newName += counter;
      }
      var targetSheet = activeSpreadsheet.duplicateActiveSheet().setName(newName);
      targetSheet.setTabColor("1E824C");
    }
        var activeCell = activeSheet.getActiveCell();
        if (radioFull) {
            translateFullPage(targetSheet, sourceLangage, targetLangage);
        } else if (radioSelected) {
            translateSelectedCells(targetSheet, activeRange, sourceLangage, targetLangage);
        } else if (radioCrazy) {
            translateFullPageCrazy(targetSheet, activeRange, sourceLangage, targetLangage);
        } 
      
        activeSpreadsheet.toast("Done.", "", 3);
    } catch (err) {
      activeSpreadsheet.toast("An error occured:" + err);
    }
}

/**
 *
 * Code for translate full page content from a source to a target langage. 
 *
 **/
function translateFullPage(targetSheet, sourceLangage, targetLangage) {
    var lrow = targetSheet.getLastRow();
    var lcol = targetSheet.getLastColumn();
    for (var i = 1; i <= lrow; i++) {
        for (var j = 1; j <= lcol; j++) {
            if (targetSheet.getRange(i, j).getValue() != "") {
                var activeCellText = targetSheet.getRange(i, j).getValue();
                var activeCellTranslation = LanguageApp.translate(activeCellText, sourceLangage, targetLangage);
                targetSheet.getRange(i, j).setValue(activeCellTranslation);
            }
        }
    }
}


/**
 *
 * Code for translate full page content from a source to a target langage. 
 *
 **/
function translateFullPageCrazy(targetSheet, sourceLangage, targetLangage) {
  var testing=false;
  if(targetSheet==undefined){
   var spreadApp = this.SpreadsheetApp;
    var sheet = spreadApp.create("TestSheet",5,5);
    spreadApp.flush()
    sheet.getRange('A1').setValue('en');
    sheet.getRange('B1').setValue('fr');
    sheet.getRange('C1').setValue('de');
    sheet.getRange('D1').setValue('es');
    sheet.getRange('E1').setValue('nl');
    sheet.getRange('A2').setValue('hello');
    sheet.getRange('A3').setValue('processing');
    sheet.getRange('A4').setValue('finished');
    spreadApp.flush()
    targetSheet = sheet.getSheets()[0];
    testing=true;
  }
  

var languagesToUse = [];
 
  var masterLang = "en";    
    var lrow = targetSheet.getLastRow();
    var lcol = targetSheet.getLastColumn();
  for (var i = 1; i <= lrow; i++) {
    for (var j = 1; j <= lcol; j++) {
      if (targetSheet.getRange(i, j).getValue() != "") {
        var activeCellText = targetSheet.getRange(i, j).getValue();
      }else{
       var activeCellText = targetSheet.getRange(i, 1).getValue(); 
      }
        
        if(i==1){
          if(j==1){
            masterLang=activeCellText;
          }
          
           languagesToUse.push(activeCellText);
          
          
        }
        else {
          if(j!=1){
        var currentLang=  languagesToUse[j-1];
        var activeCellTranslation = LanguageApp.translate(activeCellText, masterLang,currentLang);

        targetSheet.getRange(i, j).setValue(activeCellTranslation);
          }
        }
      
        }
    }

  if(!testing){
  targetSheet.showSheet();//.getParent().toast("Woohoo");
  }
  /*
  uncomment the else block below to remove the test sheet when debugging. 
  Should only fire if running test anyway, but leave test example for user to follow.
  */
  /*  else{
   targetSheet.getParent().deleteSheet(targetSheet); 
  }
  */
}

/**
 *
 * Code for translate only selected range content in a sheet from a source to a target langage. 
 *
 **/
function translateSelectedCells(targetSheet, activeRange, sourceLangage, targetLangage) {
    var range = targetSheet.getRange(activeRange);
    var numRows = range.getNumRows();
    var numCols = range.getNumColumns();
    for (var i = 1; i <= numRows; i++) {
      for (var j = 1; j <= numCols; j++) {
        var activeCellText = range.getCell(i,j).getValue();
        var activeCellTranslation = LanguageApp.translate(activeCellText, sourceLangage, targetLangage);
        range.getCell(i,j).setValue(activeCellTranslation);
        range.getCell(i,j).setBackground("#1E824C");
        range.getCell(i,j).setFontColor("#FFFFFF");
      }
    }
}
