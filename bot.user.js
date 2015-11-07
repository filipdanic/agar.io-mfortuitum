// ==UserScript==
// @name        Mycobacterium_Fortuitum
// @namespace   Mycobacterium_Fortuitum
// @include     http://agar.io/*
// @version     0.1
// @grant       none
// @author      https://github.com/filipdanic
// ==/UserScript==

var mycobacteriumFortuitumBotVersion = "dev_0.1";

window.botList = window.botList || [];

function MFortuitum() {
    this.name = "Mycobacterium_Fortuitum_"+mycobacteriumFortuitumBotVersion;
    this.keyAction = function(key) {w};
    this.displayText = function() {return [s];};
    this.mainLoop = function() {
        console.log("Move");
        return [screenToGameX(getMouseX()),
                screenToGameY(getMouseY())];
    };
}
window.botList.push(new MFortuitum());
window.updateBotList(); //This function might not exist yet.
