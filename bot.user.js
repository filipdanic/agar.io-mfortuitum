// ==UserScript==
// @name        Mycobacterium_Fortuitum
// @namespace   Mycobacterium_Fortuitum
// @include     http://agar.io/*
// @version     0.1
// @grant       none
// @author      https://github.com/filipdanic
// ==/UserScript==
var mycobacteriumFortuitumBotVersion = "dev_0.1";

/*
  If these debug variables are set to 1 then they will always call console.log
  and dump their date in there.
*/
const DEBUG_FOOD = 0;
const DEBUG_THREATS = 0;
const DEBUG_DIRECTION = 1;
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
        size1 = size1 || 0;
        size2 = size2 || 0;
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
      Clusters food blobs based on the list of all foods
    */
    this.clusterFood = function(foodList, blobSize) {
      var clusters = [];
      var addedCluster = false;
      for (var i = 0; i < foodList.length; i++) {
          for (var j = 0; j < clusters.length; j++) {
              if (this.computeDistanceBetweenBlobs(foodList[i][0], foodList[i][1], clusters[j][0], clusters[j][1]) < blobSize * 2) {
                  clusters[j][0] = (foodList[i][0] + clusters[j][0]) / 2;
                  clusters[j][1] = (foodList[i][1] + clusters[j][1]) / 2;
                  clusters[j][2] += foodList[i][2];
                  addedCluster = true;
                  break;
              }
          }
          if (!addedCluster) {
              clusters.push([foodList[i][0], foodList[i][1], foodList[i][2], 0]);
          }
          addedCluster = false;
      }
      return clusters;
    };

    /*
      Analyze the game space and returns a list of food blobs, viruses and threats in the nearby area
    */
    this.getAllObjects = function(that, listToUse, blob) {
        var foodElementList = [];
        var threatsElementList = [];
        var player = getPlayer();

        Object.keys(listToUse).forEach(function(element, index) {
            var identityCheck = that.isItMe(player, listToUse[element]);
            if (!identityCheck) {
                if (that.isFood(blob, listToUse[element]) && listToUse[element].isNotMoving()) {
                    foodElementList.push(listToUse[element]);
                }
                else if (that.isThreat(blob, listToUse[element])) {
                    threatsElementList.push(listToUse[element]);
                }
            }
        });

        var foodList = [];
        for (var i = 0; i < foodElementList.length; i++) {
            foodList.push([foodElementList[i].x, foodElementList[i].y, foodElementList[i].size]);
        }

        return [foodList, threatsElementList];
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
      var botMoveChoice = []; // an array that we pass as the result of the main loop; eg: [x,y]
      var foodList = []; // will contain a list of all food
      var threatList = []; // will contain a list of threats
      var clusterAllFood = []; // smart clustering
      var bestCluster = []; // helper variable to assist us in finding the best cluster
      var bestClusterIndex = 0; // the index of the best cluster

      if (player.length > 0) {
        for (var k = 0; k < player.length; k++) {
            if (true) {
                drawPoint(player[k].x, player[k].y + player[k].size, 0, "" + (getLastUpdate() - player[k].birth) + " / " + (30000 + (player[k].birthMass * 57) - (getLastUpdate() - player[k].birth)) + " / " + player[k].birthMass);
            }
        }
        for (k = 0; /*k < player.length*/ k < 1; k++) {
          var allObjects = this.getMasterRecord(player[k]);
          var allPossibleFood = allObjects[0];
          var allPossibleThreats = allObjects[1];
          foodList = allPossibleFood;
          threatList = allPossibleThreats;
          if (DEBUG_FOOD == 1){
            console.log("<allPossibleFood[0]>");
            console.log(allPossibleFood[0]);
            console.log("</allPossibleFood[0]>");
          }
          if (DEBUG_THREATS == 1){
            console.log("<allPossibleThreats[0]>");
            console.log(allPossibleThreats[0]);
            console.log("</allPossibleThreats[0]>");
          }

        }
      }

      /*
        * are there any incoming threats?
      */
      threatIndex = 0;
      threatMinDistance = 999999999;
      foundThreat = false;
      for (i = 0; i < threatList.length; i++) {
        currentThreatDistance = this.computeDistanceBetweenBlobs(tempMoveX, tempMoveY, threatList[i].x, threatList[i].y);
        if (currentThreatDistance < (threatList[i].size + 250) ){
          if (currentThreatDistance < threatMinDistance){
            foundThreat = true;
            threatMinDistance = currentThreatDistance;
            threatIndex = i;
          }
        }
      }
      if (foundThreat == true){
        if (DEBUG_DIRECTION == 1) console.log('INCOMING: MOVE AWAY FROM NEARBY THREAT');
        botMoveChoice = [-threatList[threatIndex].x, -threatList[threatIndex].y ];
        return botMoveChoice;
      }


      /*
        * are there any suitable clusters?
      */

      clusterAllFood = this.clusterFood(foodList, player[0].size);
      bestClusterIndex = 0;
      clusterFound = false;
      bestCluster = clusterAllFood[0][2];
      for (var i = 0; i < clusterAllFood.length; i++) {
          if (bestCluster < clusterAllFood[i][2]) {
              bestCluster = clusterAllFood[i][2];
              bestClusterIndex = i;
              clusterFound = true;
          }
      }

      /*
        * no clusters? now what?
      */
      if (clusterFound == false){
        if (DEBUG_DIRECTION == 1) console.log('No cluster or threats, just head out randomly');
        botMoveChoice = [foodList[0][0],foodList[0][1]];
        return botMoveChoice;
      }

      if (DEBUG_DIRECTION == 1) console.log('Moving towards a food cluster');
      botMoveChoice = [clusterAllFood[bestClusterIndex][0],clusterAllFood[bestClusterIndex][1]];
      return botMoveChoice;

    };
}

MFortuitumBot = new MFortuitum();
window.botList.push(MFortuitumBot);
console.log("Pushed MFortuitum");
window.updateBotList(); //This function might not exist yet.
