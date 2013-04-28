/* Todo: 
* split in several files/classes
* add some unit tests
*/

(function(window) {

var gameIdMatch = new RegExp("^Amazons game #([0-9]+)$", "i").exec($("head title").text());
if (gameIdMatch == null)
  return; // not an Amazons game

var summaryParentTable = $("tr [valign='top'] > td > table > tbody").last()
summaryParentTable.append("Squares:<br/>");
summaryParentTable.append("white: <span id='whiteSquares'>?</span><br/>");
summaryParentTable.append("black: <span id='blackSquares'>?</span><br/>");
summaryParentTable.append("neutral: <span id='neutralSquares'>?</span><br/>");
summaryParentTable.append("dead: <span id='deadSquares'>?</span><br/>");
summaryParentTable.append("<input id='startExploratoryMoves' type='button' value='start making exploratory moves'></input>");
summaryParentTable.append("<input id='stopExploratoryMoves' type='button' value='stop making exploratory moves'></input>");
summaryParentTable.append("<a id='undoAll'>Undo All</a>&nbsp;");
summaryParentTable.append("<span id='exploratoryMoveContainer'></span>");

$("#stopExploratoryMoves").hide();
$("#undoAll").hide();
$("#startExploratoryMoves").click(function() {
  $("#startExploratoryMoves").hide();
  $("#stopExploratoryMoves").show();
  $("#undoAll").show();
  makeInteractive();
});
$("#stopExploratoryMoves").click(function() {
  $("#startExploratoryMoves").show();
  $("#stopExploratoryMoves").hide();
  $("#undoAll").hide();
  undoAllExploratoryMoves()
});
$("#undoAll").click(
    function(event) {
       undoAllExploratoryMoves()
       makeInteractive();
     });
function undoAllExploratoryMoves() {
  clickPhase = phaseSelectQueen;
  table.html(origTableHtml); 
  tagRegions();
  $('#exploratoryMoveContainer').empty();
}

var table = $("td [width='32']").first().parent().parent().parent();
var tableNode = table.get()[0];
var origTableHtml = table.html()

// return img
// empty: <img src="/ng/images/source/amazon/0.gif" alt="" border="0" height="32" width="32">
// arrow: <img src="/ng/images/source/amazon/bcircle.gif" alt="S" border="0" height="32" width="32">
// black queen <img src="/ng/images/source/amazon/bq.gif" alt="B" border="0" height="32" width="32">
// white queen <img src="/ng/images/source/amazon/wq.gif" alt="W" border="0" height="32" width="32">
function getTableCell(i,j) {
  var td = tableNode.rows[1+i].cells[1+j];
  var img = td.getElementsByTagName("IMG")[0];
  return img;
}

var imgEmptyCell = "/ng/images/source/amazon/0.gif"
var imgArrow = "/ng/images/source/amazon/bcircle.gif"
var imgBlackQueen = "/ng/images/source/amazon/bq.gif" 
var imgWhiteQueen = "/ng/images/source/amazon/wq.gif"

function getCellValue(cell) {
  return cell.attributes["src"].value;
}

function setCellValue(cell, val) {
   cell.attributes["src"].value = val;
}

function Region(id) {
  this.id = id;
  this.squares = 0;
  this.whiteQueens = false; // true if a queen is adjacent to region
  this.blackQueens = false;
}

function tagRegions() {

  // reset all regions:
  for (var i=0; i<10; ++i)
    for (var j=0; j<10; ++j)
      getTableCell(i,j).region = undefined;
      //getTableCell(i,j).src = "/ng/images/source/amazon/bq.gif";

  // find next cell not assigned with a region & grow this region
  var regions = new Array();
  for (var i=0; i<10; ++i)
    for (var j=0; j<10; ++j) {
      var cell = getTableCell(i,j);
      if (cell.region == undefined) {
        var regionId = regions.length;
        var region = new Region(regionId);
        var squares = growRegion(i,j,region);
        if (squares > 0) {
           region.squares = squares;
           regions.push(region);
        }
      }
    }

  // summarize owned & neutral squares
  var totalSquares = new Array(4);
  var getOwnershipIndex = function(whiteQueens, blackQueens) {
    return (whiteQueens ? 2 : 0) + (blackQueens ? 1 : 0);
  }
  var ownershipName = new Array();
  ownershipName[getOwnershipIndex(false,false)] = "dead"
  ownershipName[getOwnershipIndex(true,false)] = "white"
  ownershipName[getOwnershipIndex(false,true)] = "black"
  ownershipName[getOwnershipIndex(true,true)] = "neutral"
  for (var i=0; i<4; ++i)
     totalSquares[i] = 0;
  _.each(regions, function(region) {
      totalSquares[getOwnershipIndex(region.whiteQueens, region.blackQueens)] += region.squares;
  }) 

  $("#whiteSquares").text(totalSquares[getOwnershipIndex(true,false)]);
  $("#blackSquares").text(totalSquares[getOwnershipIndex(false,true)]);
  $("#neutralSquares").text(totalSquares[getOwnershipIndex(true,true)]);
  $("#deadSquares").text(totalSquares[getOwnershipIndex(false,false)]);

  // assign mouseover tooltips for each square
  for (var i=0; i<10; ++i)
    for (var j=0; j<10; ++j) {
      var cell = getTableCell(i,j);
      var region = cell.region;
      if (region != undefined)
        cell.title = region.squares + " " + ownershipName[getOwnershipIndex(region.whiteQueens, region.blackQueens)];
    }
}

function growRegion(i0,j0,region) {
  var cell0 = getTableCell(i0,j0);
  var squareN = 0;
  var cellValue = getCellValue(cell0);
  if (cellValue==imgEmptyCell && cell0.region==undefined) {
    cell0.region = region;
    ++squareN;
    for (var di=-1; di<=1; ++di)
      for (var dj=-1; dj<=1; ++dj) {
        var i=i0+di;
        var j=j0+dj;
        if (0<=i && i<10 && 0<=j && j<10)  // otherwise cell on board edge 
          squareN += growRegion(i, j, region);
      }
  }
  // update region ownership
  if (cellValue==imgWhiteQueen)
    region.whiteQueens = true;
  if (cellValue==imgBlackQueen)
    region.blackQueens = true;
  return squareN;
}

function canMoveFromTo(from, to) {
  var i = from.rowX;
  var j = from.colX;
  var getMoveDelta= function(f,t) { 
    if (f==t)
      return 0;
    return f<t ? 1 : -1;
  }
  var di = getMoveDelta(from.rowX, to.rowX);
  var dj = getMoveDelta(from.colX, to.colX);
  if (di==0 && dj==0)
    return false; // degenerate case: same cell
  while (true)
  {
     i += di;
     j += dj;
     if (!(0<=i && i<10 && 0<=j && j<10))
       return false; // off board, cells were not aligned
     if (getCellValue(getTableCell(i,j)) != imgEmptyCell)
       return false;
     if (i==to.rowX && j==to.colX)
       return true;
  }
}

function coordsToString(cell) {
  return String.fromCharCode('a'.charCodeAt(0)+cell.colX) + (10-cell.rowX).toString();
}

var cellQueenFrom = null;
var cellQueenTo=null;
var phaseSelectQueen = "select queen";
var phaseMoveQueen = "move queen to";
var phaseShoot =  "shoot to";
var clickPhase = phaseSelectQueen;

function makeInteractive() {
  for (var i=0; i<10; ++i)
    for (var j=0; j<10; ++j) {
      var cell = getTableCell(i,j);
      cell.rowX = i;
      cell.colX = j;
   }
  clickPhase = phaseSelectQueen;
  table.click(function() {
    var cell = event.toElement;
    var colX = cell.colX;
    var rowX = cell.rowX;
    if (colX==undefined && rowX==undefined)
      return; // didnt click img

    var isQueen = function (val) { return val==imgBlackQueen || val ==imgWhiteQueen; }
    var cellValue = getCellValue(cell);

    if (clickPhase==phaseSelectQueen && isQueen(cellValue)) {
      cellQueenFrom = cell;
      cell.style.backgroundColor = "green";
      clickPhase = phaseMoveQueen;
    }
    else if (clickPhase==phaseMoveQueen && isQueen(cellValue)) {
      // undo last click, choose different queen
      cellQueenFrom.style.backgroundColor = null;
      cellQueenFrom = cell;
      cell.style.backgroundColor = "green";
    }
    else if (clickPhase==phaseMoveQueen && canMoveFromTo(cellQueenFrom, cell)) {
      cellQueenFrom.style.backgroundColor = null;
      cellQueenTo = cell;
      setCellValue(cellQueenTo, getCellValue(cellQueenFrom)); // either black or white queen
      setCellValue(cellQueenFrom, imgEmptyCell);
      cell.style.backgroundColor = "red";
      clickPhase = phaseShoot 
    }
   else if (clickPhase == phaseShoot && canMoveFromTo(cellQueenTo, cell)) {
      cellQueenTo.style.backgroundColor = null;
      setCellValue(cell, imgArrow);
      clickPhase = phaseSelectQueen
      tagRegions();

      // prepare undo:
      $("#exploratoryMoveContainer").append("<a>" 
           + coordsToString(cellQueenFrom) + "-"
           + coordsToString(cellQueenTo) + "/"
           + coordsToString(cell) + "</a> ");
      var tableHtmlAfterMove = table.html()
      $("#exploratoryMoveContainer > a ").last().click(
          function(event) {
            // undo till after the clicked move
            $(this).nextAll().remove()
            table.html(tableHtmlAfterMove)
            tagRegions();
            makeInteractive();
           })

      cellQueenTo = null
      cellQueenFrom = null
   }

    return false; // cancel bubble
  });
}

// todo?
function tagReachableCells(imgQueen) {

  // reset all reachability info:
  for (var i=0; i<10; ++i)
    for (var j=0; j<10; ++j)
      getTableCell(i,j).reachable = {};

  for (var i=0; i<10; ++i)
    for (var j=0; j<10; ++j) {
      var cell = getTableCell(i,j);
      if (getCellValue(cell)==imgQueen)
        ;//cell.style.backgroundColor = "black"
    }
 }

tagRegions();
tagReachableCells(imgBlackQueen) 

})(window);