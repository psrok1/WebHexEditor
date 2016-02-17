var View;
(function (View) {
    var Editor = (function () {
        function Editor() {
            var editorElement = document.createElement("div");
            editorElement.className = "editor";
            this.editorElement = editorElement;
            var offsColumn = document.createElement("div");
            offsColumn.className = "ed-offs-column";
            editorElement.appendChild(offsColumn);
            this.elementOffsetColumn = offsColumn;
            var byteData = document.createElement("div");
            byteData.className = "ed-byte-data";
            editorElement.appendChild(byteData);
            this.elementByteData = byteData;
            var asciiData = document.createElement("div");
            asciiData.className = "ed-ascii-data";
            editorElement.appendChild(asciiData);
            this.elementAsciiData = asciiData;
        }
        Editor.prototype.getHTMLElement = function () {
            return this.editorElement;
        };
        return Editor;
    })();
})(View || (View = {}));
/// <reference path="app.ts" /> 
var Benchmark;
(function (Benchmark) {
    var FunctionPerf = (function () {
        function FunctionPerf() {
            this.times = [];
            this.startTime = null;
        }
        FunctionPerf.prototype.startTimer = function () {
            this.startTime = Date.now();
        };
        FunctionPerf.prototype.stopTimer = function () {
            if (!this.startTime)
                return;
            var curTime = Date.now();
            this.times.push(curTime - this.startTime);
            this.startTime = null;
        };
        FunctionPerf.prototype.getCallsNumber = function () {
            return this.times.length;
        };
        FunctionPerf.prototype.getMaximumTime = function () {
            return Math.max.apply(Math, this.times);
        };
        FunctionPerf.prototype.getMinimumTime = function () {
            return Math.min.apply(Math, this.times);
        };
        FunctionPerf.prototype.getAverageTime = function () {
            var sum = this.times.reduce(function (a, b) { return a + b; });
            var avg = sum / this.times.length;
            return avg;
        };
        FunctionPerf.prototype.toString = function () {
            return " called " + this.getCallsNumber() + " times; avg="
                + this.getAverageTime() + "ms; min..max="
                + this.getMinimumTime() + ".." + this.getMaximumTime() + "ms";
        };
        return FunctionPerf;
    })();
    var timers = {};
    function getTimer(name) {
        if (!timers[name])
            timers[name] = new FunctionPerf();
        return timers[name];
    }
    Benchmark.getTimer = getTimer;
    function startTimer(name) {
        getTimer(name).startTimer();
    }
    Benchmark.startTimer = startTimer;
    function stopTimer(name) {
        getTimer(name).stopTimer();
    }
    Benchmark.stopTimer = stopTimer;
    function printResults() {
        for (var timerName in timers) {
            console.log(timerName + timers[timerName].toString());
        }
    }
    Benchmark.printResults = printResults;
})(Benchmark || (Benchmark = {}));
//# sourceMappingURL=app.js.map