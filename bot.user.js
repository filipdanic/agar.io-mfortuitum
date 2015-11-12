// ==UserScript==
// @name        Mycobacterium_Fortuitum
// @namespace   Mycobacterium_Fortuitum
// @include     http://agar.io/*
// @version     0.1
// @grant       none
// @author      https://github.com/filipdanic
// ==/UserScript==
var mycobacteriumFortuitumBotVersion = "dev_0.1";
const STANDARD_RATIO = 1.33;

window.botList = window.botList || [];

function MFortuitum() {
    this.name = "Mycobacterium_Fortuitum_" + mycobacteriumFortuitumBotVersion;
    this.keyAction = function(key) {w};
    this.displayText = function() {
        return [s];
    };

    /*
      <START: MATH UTILITIES>
    */

    /*
      To be bigger than the other blob we need to fit within the STANDARD_RATIO
      if enemy.size^2 * ratio is larger than player.size^2 then we need to be careful
    */
    this.compareSize = function(blob1, blob2, ratio) {
      if (blob1.size * blob1.size * ratio < blob2.size * blob2.size) {
          return true;
      }
      return false;
    };

    /*
      Compute the distance between two blobs based on their coordinates and possibly size
    */
    this.computeDistanceBetweenBlobs = function(x1, y1, x2, y2, size1, size2) {
        /*
          size1 and size2 are optional arguments;
          replace them with 0 if they are not set
        */
        size1 = s1 || 0;
        size2 = s2 || 0;
        var x_distance = x1 - x2;
        var y_distance = y1 - y2;
        var distance = Math.sqrt(x_distance * x_distance + y_distance  * y_distance ) - (size1 + size2);

        return distance;
    };

    /*
      </END: MATH UTILITIES>
    */


    /*
      <START: GAME RECEPTORS>
    */

    /*
      Returns the mass of the blob based on it's size;
      from the wiki: mass = size*size / 100
    */
    this.getBlobMass = function(size) {
        return Math.pow(size / 10, 2);
    };
    /*
      is the observed cell a virus?
      the color of the virus is #33ff33
    */
    this.isVirus = function(blob, cell) {
      if (blob === null) {
          if (cell.isVirus()){return true;}
          else {return false;}
      }

      if (cell.isVirus() && this.compareSize(cell, blob, 1.2)) {
          return true;
      } else if (cell.isVirus() && cell.color.substring(3,5).toLowerCase() != "ff") {
          return true;
      }
      return false;
    };
    /*
      Check if a cell is considered food or not
      Anything that's below the 1.33 ratio or has a total size <= 13 is food!
    */
    this.isFood = function(blob, cell) {
        if (!cell.isVirus() && this.compareSize(cell, blob, STANDARD_RATIO) || (cell.size <= 13)) {
            return true;
        }
        return false;
    };
    /*
      Is the cell we're looking at a threat?
      If it's a bit bigger than us then it sure as hell is
    */
    this.isThreat = function(blob, cell) {

        if (!cell.isVirus() && this.compareSize(blob, cell, STANDARD_RATIO)) {
            return true;
        }
        return false;
    };

    /*
      </END: GAME RECEPTORS>
    */

    /*
      <START: MAIN BOT LOGIC>
    */

    /*
      Check if the cell is the player
      We don't want to add ourselves as potential food for example :)
    */
    this.isItMe = function(player, cell){
      for (var i = 0; i < player.length; i++) {
          if (cell.id == player[i].id) {
              return true;
          }
      }
      return false;
    };

    /*
      Analyze the game space and returns a list of food blobs, viruses and threats in the nearby area
    */
    this.getAllObjects = function(that, listToUse, blob) {
        var foodElementList = [];
        var player = getPlayer();

        Object.keys(listToUse).forEach(function(element, index) {
            var identityCheck = that.isItMe(player, listToUse[element]);
            if (!identityCheck) {
                if (that.isFood(blob, listToUse[element]) && listToUse[element].isNotMoving()) {
                    foodElementList.push(listToUse[element]);
                }
            }
        });

        foodList = [];
        for (var i = 0; i < foodElementList.length; i++) {
            foodList.push([foodElementList[i].x, foodElementList[i].y, foodElementList[i].size]);
        }

        return [foodList];
    };

    /*
      Creates a lit of all the blobs in the nearby area and returns them to the main logic
      for eveulation
    */
    this.getMasterRecord = function(blob) {
        var allBlobsList = [];
        var player = getPlayer();
        var interNodes = getMemoryCells();

        allBlobsList = this.getAllObjects(this, interNodes, blob);
        return allBlobsList;
    };

    /*
      </END: MAIN BOT LOGIC>
    */


    /*
      The Main Loop
    */
    this.mainLoop = function() {
      var player = getPlayer(); // main player instance
      var interNodes = getMemoryCells(); // list of nearby nodes
      var tempMoveX = getPointX(); //current x path
      var tempMoveY = getPointY(); //current y path
      var botMoveChoice = []; // an array that we pass as the result of the main loop; eg: [[x1,y1], [x2,y2]]

        if (player.length > 0) {
          for (var k = 0; k < player.length; k++) {
              if (true) {
                  drawPoint(player[k].x, player[k].y + player[k].size, 0, "" + (getLastUpdate() - player[k].birth) + " / " + (30000 + (player[k].birthMass * 57) - (getLastUpdate() - player[k].birth)) + " / " + player[k].birthMass);
              }
          }
          for (var k = 0; /*k < player.length*/ k < 1; k++) {
            var allObjects = this.getMasterRecord(player[k]);
            var allPossibleFood = allObjects[0];
            console.log(allPossibleFood);
          }
        }
      var temp1 = Math.floor(Math.random()*1000);
      var temp2 = Math.floor(Math.random()*1000);
      var temp3 = Math.floor(Math.random()*1000);
      var temp4 = Math.floor(Math.random()*1000);
      botMoveChoice = [[temp1, temp2], [temp3, temp4]];
      console.log(botMoveChoice);
      return botMoveChoice;

    };
}

MFortuitumBot = new MFortuitum();
window.botList.push(MFortuitumBot);
console.log("Pushed MFortuitum");
window.updateBotList(); //This function might not exist yet.
