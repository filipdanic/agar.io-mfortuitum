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

var STANDARD_RATIO = 1.33;
var SAFE_DISTANCE = 400;
var SPLIT_DISTANCE = 720;
var GENERATION = 0;
window.SHOULD_MUTATE = true;

window.botList = window.botList || [];

function MFortuitum() {
    this.name = "Mycobacterium_Fortuitum_" + mycobacteriumFortuitumBotVersion;
    this.keyAction = function(key) {w};
    this.displayText = function() {
        return ["Current generation #" + GENERATION];
    };

    // ==== MATH UTILS ====

    /*
      compareSize: To be bigger than the other blob we need to fit within the STANDARD_RATIO
      if enemy.size^2 * ratio is larger than player.size^2 then we need to be careful
    */
    this.compareSize = function(blob1, blob2, ratio) {
      if (blob1.size * blob1.size * ratio < blob2.size * blob2.size) {
          return true;
      }
      return false;
    };

    /*
      computeDistanceBetweenBlobs: Compute the distance between two blobs based on their coordinates
      and (optionally) size
    */
    this.computeDistanceBetweenBlobs = function(x1, y1, x2, y2, size1, size2) {
        /*
          size1 and size2 are optional arguments;
          they are replaced with 0 if not supplied
        */
        size1 = size1 || 0;
        size2 = size2 || 0;
        var x_distance = x1 - x2;
        var y_distance = y1 - y2;
        var distance = Math.sqrt(x_distance * x_distance + y_distance  * y_distance ) - (size1 + size2);

        return distance;
    };
    /*
      multiplyVector: simple vector multiplication
    */
    this.multiplyVector = function(vector, m) {
      return [vector[0] * m, vector[1] * m];
    }

    // ==== BOT RECEPTORS ==== 

    /*
      getBlobMass: Returns the mass of the blob based on it's size;
      from the wiki: mass = size*size / 100
    */
    this.getBlobMass = function(size) {
        return Math.pow(size / 10, 2);
    };

    /*
      isVirus: is the observed cell a virus?
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
      isFood: Check if a cell is considered food or not
      Anything that's below the 1.33 ratio or has a total size <= 13 is food!
    */
    this.isFood = function(blob, cell) {
        if (!cell.isVirus() && this.compareSize(cell, blob, STANDARD_RATIO) || (cell.size <= 13)) {
            return true;
        }
        return false;
    };

    /*
      isThreat: Is the cell we're looking at a threat?
      If it's a bit bigger than us then it sure as hell is
    */
    this.isThreat = function(blob, cell) {

        if (!cell.isVirus() && this.compareSize(blob, cell, STANDARD_RATIO)) {
            return true;
        }
        return false;
    };

    /*
      isItMe: Check if the cell is the player
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

    // ==== BOT LOGIC ====

    /*
      clusterFood: Clusters food blobs based on the list of all foods
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
      getAllObjects: Analyze the game space and returns a list of food blobs, 
      viruses and threats in the nearby area
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
      getMasterRecord: Creates a list of all the blobs in the nearby area and returns them to the main logic
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
      canSplit: should the bot take special care against the enemy?
    */
    this.canSplit = function(player1, player2) {
        return this.compareSize(player1, player2, 2.8) && !this.compareSize(player1, player2, 20);
    };

    /*
      canMutate: is it time for the cell to mutate?
    */
    this.canMutate = function(size) {
      if (size < 80 && window.SHOULD_MUTATE) {
        setTimeout(function (){ 
          window.SHOULD_MUTATE = true; 
        }, 5000);
        return true;
      } else {
        return false;
      }    
    }

    /*
      ==== The Main Loop ====
    */
    this.mainLoop = function() {

      var DEBUG_DIRECTION = 1;
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
        for (k = 0; /*k < player.length; broken for now */ k < 1; k++) {
          drawCircle(player[k].x, player[k].y, player[k].size + SPLIT_DISTANCE, 5);
          var allObjects = this.getMasterRecord(player[k]);
          var allPossibleFood = allObjects[0];
          var allPossibleThreats = allObjects[1];
          foodList = allPossibleFood;
          threatList = allPossibleThreats;

          if (this.canMutate(player[k].size)) {
            var randomGene1 = Math.floor(Math.random() * 21) - 10;
            var randomGene2 = Math.floor(Math.random() * 21) - 10;
            SAFE_DISTANCE = SAFE_DISTANCE + randomGene1;
            SPLIT_DISTANCE = SPLIT_DISTANCE + randomGene2;
            GENERATION++;
            SHOULD_MUTATE = false;
            console.log('Current generation: ' + GENERATION + ' | SAFE_DISTANCE: ' + SAFE_DISTANCE + ' | SPLIT_DISTANCE: ' + SPLIT_DISTANCE);
          }
        }
      }

      clusterAllFood = this.clusterFood(foodList, player[0].size); //find all clusters

      /*
        * are there any incoming threats?
        * are there any clusters that are dangerous?
      */
      numberOfPotentialThreats = threatList.length;
      for (i = 0; i < numberOfPotentialThreats; i++) {
        var enemyCanSplit = this.canSplit(player[0], allPossibleThreats[i]);
        var minimalDistance = (enemyCanSplit ? SPLIT_DISTANCE : SAFE_DISTANCE);
        if (enemyCanSplit) {
            drawCircle(allPossibleThreats[i].x, allPossibleThreats[i].y, SPLIT_DISTANCE, 0);
            drawCircle(allPossibleThreats[i].x, allPossibleThreats[i].y, SPLIT_DISTANCE + player[0].size, 6);
        } else {
            drawCircle(allPossibleThreats[i].x, allPossibleThreats[i].y, SAFE_DISTANCE, 3);
            drawCircle(allPossibleThreats[i].x, allPossibleThreats[i].y, SAFE_DISTANCE + player[0].size, 6);
        }

        for (j = 0; j < clusterAllFood.length; j++){
          if (this.computeDistanceBetweenBlobs(clusterAllFood[j][0], clusterAllFood[j][1], threatList[i].x, threatList[i].y) < threatList[i].size + minimalDistance){
              clusterAllFood.splice(j,1);
          }
        }
      }

      /*
        * Remaining clusters
      */
      var numberOfClusters = clusterAllFood.length;
      if (numberOfClusters > 0){
        bestCluster = clusterAllFood[0][2] / this.computeDistanceBetweenBlobs(player[0].x, player[0].y, clusterAllFood[0][0], clusterAllFood[0][1]);
        bestClusterIndex = 0;
        for (i=1; i<numberOfClusters; i++){
          var currentClusterValue = clusterAllFood[i][2] / this.computeDistanceBetweenBlobs(player[0].x, player[0].y, clusterAllFood[i][0], clusterAllFood[i][1]);
          if (bestCluster < currentClusterValue  ){
            bestCluster = currentClusterValue;
            bestClusterIndex = i;
          }
        }
        bestCluster = clusterAllFood[bestClusterIndex];
        
        //bot is surrounded probably
        if (this.computeDistanceBetweenBlobs(player[0].x, player[0].y, bestCluster[0], bestCluster[1]) <= 10) {
          tempMoveX = getPointX();
          tempMoveY = getPointY();
          var enemyAverageX = 0;
          var enemyAverageY = 0;

          for (var i = 0; i < threatList.length; i++) {
              var enemy = threatList[i];
              enemyAverageX += enemy.x;
              enemyAverageY += enemy.y;
          }

          enemyAverageX /= threatList.length;
          enemyAverageY /= threatList.length;
          var escapeVector = this.multiplyVector([enemyAverageX, enemyAverageY], -1);
          tempMoveX += moveAwayVector[0];
          tempMoveY += moveAwayVector[1];
          console.log('Use escape vector');
          drawLine(player[0].x, player[0].y, tempMoveX, tempMoveY, 5);
          botMoveChoice = [tempMoveX, tempMoveY];
          return botMoveChoice;      
        }

        for (var i = 0; i < threatList.length; i++) {
          var enemy = threatList[i];
          if (this.computeDistanceBetweenBlobs(player[0].x, player[0].y, enemy.x, enemy.y, player[0].size, enemy.size) <= 50){
            console.log('Too close for comfort');
            botMoveChoice = [enemy.x, -enemy.y];
            return botMoveChoice;
          }
        }


        if (DEBUG_DIRECTION == 1) console.log('Moving towards best cluster');
        drawLine(player[0].x, player[0].y, bestCluster[0], bestCluster[1], 5);
        botMoveChoice = [bestCluster[0], bestCluster[1]];
        return botMoveChoice;
      }
      else{
        /*
          * no clusters? now what?
        */
        if (DEBUG_DIRECTION == 1) console.log('Moving towards closest food');
        botMoveChoice = [allPossibleFood[0][0],allPossibleFood[0][1]];
        return botMoveChoice;
      }
    };
}

MFortuitumBot = new MFortuitum();
window.botList.push(MFortuitumBot);
console.log("Pushed MFortuitum");
window.updateBotList(); //This function might not exist yet.
