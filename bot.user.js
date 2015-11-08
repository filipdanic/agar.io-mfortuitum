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
      Returns the mass of the blob based on it's size;
      from the wiki: mass = size*size / 100
    */
    this.getBlobMass = function(size) {
        return Math.pow(size / 10, 2);
    };

    /*
      To be bigger than the other blob we need to fit within the STANDARD_RATIO
      if enemy.size^2 * ratio is larger than player.size^2 then we need to be careful
    */
    this.compareSize = function(blob1, blob2, ratio) {
      if (blob1.size * blob1.size * ratio < blobl2.size * blob2.size) {
          return true;
      }
      return false;
    };
    /*
      is the observed cell a virus?
      the color of the virus is #33ff33
    */
    this.isVirus = function(blob, cell) {
      if (blob == null) {
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
    */
    this.isThreat = function(blob, cell) {

        if (!cell.isVirus() && this.compareSize(blob, cell, STANDARD_RATIO)) {
            return true;
        }
        return false;
    };

    this.mainLoop = function() {
        console.log("Move");
        console.log(screenToGameX(getMouseX()));
        return [screenToGameX(getMouseX()),screenToGameY(getMouseY())];
        ];
    };
}

MFortuitumBot = new MFortuitum();
window.botList.push(MFortuitumBot);
console.log("Pushed MFortuitum");
window.updateBotList(); //This function might not exist yet.
