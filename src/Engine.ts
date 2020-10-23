import { EngineConfiguration } from "./EngineConfiguration";
import { ValueContainer } from "./ValueContainer";

export class Engine {
    public readonly globals:any;
    public readonly tickRate:string;
    private readonly references:any = [];
    private accumulatedTime:number = 0;
    constructor(configuration:EngineConfiguration) {
        if(configuration == undefined) {
            throw new Error("Missing configuration.");
        }
        this.globals = this.generateGlobals(configuration.globals);
        this.tickRate = configuration.tickRate || "one-second";
    }

    private generateGlobals(globals: { [p: string]: any } | undefined) {
        if(!globals) {
            return {};
        }
        return Object.keys(globals).reduce((mapped: {[key:string]: any}, nextKey: string) => {
            const configuration = globals[nextKey];
            const newContainer = this.createReference(configuration.startingValue, undefined, configuration.updater);
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

    public getReference(id: number | null) {
        if(id !== null) {
            return this.references[id];
        }
    }

    private tick(interval: number) {
        console.log("Tick");
        Object.keys(this.globals).forEach(property => {
            this.globals[property].update(this, interval);
        });
    }

    createReference(startingValue?: any, parent?: ValueContainer, updater?: ((current: any, parent: ValueContainer | null, engine: Engine) => any) | undefined) {
        const newRef = new ValueContainer(this.references.length, this, startingValue, parent, updater);
        this.references.push(newRef);
        return newRef;
    }
}