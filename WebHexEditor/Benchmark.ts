module Benchmark {
    class FunctionPerf {
        private times: number[] = [];
        private startTime: number = null;

        public startTimer() {
            this.startTime = Date.now();
        }

        public stopTimer() {
            if (!this.startTime)
                return;
            var curTime = Date.now();
            this.times.push(curTime - this.startTime)
            this.startTime = null;
        }

        public getCallsNumber(): number {
            return this.times.length;
        }

        public getMaximumTime(): number {
            return Math.max.apply(Math, this.times);
        }

        public getMinimumTime(): number {
            return Math.min.apply(Math, this.times);
        }

        public getAverageTime(): number {
            var sum = this.times.reduce(function (a, b) { return a + b; });
            var avg = sum / this.times.length;
            return avg;
        }

        public toString(): string {
            return " called " + this.getCallsNumber() + " times; avg="
                + this.getAverageTime() + "ms; min..max="
                + this.getMinimumTime() + ".." + this.getMaximumTime() + "ms";
        }
    }

    var timers: { [name: string]: FunctionPerf; } = {};

    export function getTimer(name: string): FunctionPerf {
        if (!timers[name])
            timers[name] = new FunctionPerf();

        return timers[name];
    }

    export function startTimer(name: string) {
        getTimer(name).startTimer();
    }

    export function stopTimer(name: string) {
        getTimer(name).stopTimer();
    }

    export function printResults() {
        for (var timerName in timers) {
            console.log(timerName + timers[timerName].toString());
        }
    }
}