import PropertyConfiguration from "./PropertyConfiguration";

export default class EngineConfiguration {
    public globals:{[name:string]: PropertyConfiguration } = {};
    public tickRate:string = "one-second";
    constructor() {

    }

    public WithGlobalProperties(globals:{[name:string]: PropertyConfiguration | string | number | boolean }) {
        this.globals = this.transformGlobals(globals);
        return this;
    }

    private transformGlobals(globals: {[name:string]: any }) {
        return Object.keys(globals).reduce((transformed:any, key) => {
            const configuration = typeof globals[key] === "object" ? globals[key] : {
                startingValue: globals[key]
            };
            transformed[key] = new PropertyConfiguration(configuration.startingValue, configuration.updater);
            return transformed;
        }, {});
    }

    public WithTickRate(tickRate: string) {
        switch (tickRate) {
            case "one-second":
            case "half-second":
            case "quarter-second":
            case "tenth-second":
                break;
            default:
                throw new Error("Tick rate must be one of 'one-second', 'half-second', 'quarter-second' or 'tenth-second'");
        }
        this.tickRate = tickRate;
        return this;
    }
}