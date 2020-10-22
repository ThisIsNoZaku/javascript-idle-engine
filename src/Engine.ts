import { EngineConfiguration } from "./EngineConfiguration";
import { ValueContainer } from "./ValueContainer";

export class Engine {
    public readonly globals:any;
    public readonly tickRate:string;
    private readonly references:any = {};
    private accumulatedTime:number = 0;
    constructor(configuration:EngineConfiguration) {
        if(configuration == undefined) {
            throw new Error("Missing configuration.");
        }
        this.globals = this.generateGlobals(configuration.globals);
        this.tickRate = configuration.tickRate;
    }

    private generateGlobals(globals: { [p: string]: any }) {
        return Object.keys(globals).reduce((mapped: {[key:string]: any}, nextKey: string) => {
            const configuration = globals[nextKey];
            const newContainer = new ValueContainer(this, configuration.startingValue, null, configuration.updater);
            mapped[nextKey] =  newContainer;
            return mapped;
        }, {});
    }

    public start() {
        let interval = 1000;
        switch (this.tickRate) {
            case "half-second":
                interval = 500;
                break;
            case "quarter-second":
                interval = 250;
                break;
            case "tenth-second":
                interval = 100;
                break;
        }
        setInterval(this.tick.bind(this, interval), interval)
    }

    private tick(interval: number) {
        console.log("Tick");
        Object.keys(this.globals).forEach(property => {
            this.globals[property].update(this, interval);
        });
    }
}