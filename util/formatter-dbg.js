sap.ui.define([], function () {
    "use strict";

    return{
        serialCount: function (aSerials) {
            var iCount = (aSerials && Array.isArray(aSerials)) ? aSerials.length : 0;
            return " (" + iCount + ")";
            // return "Serial Number Data (" + iCount + ")";
        }
    }
});