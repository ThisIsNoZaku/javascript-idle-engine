import {EngineConfiguration} from "./EngineConfiguration";
import {updaterSymbol, ValueContainer} from "./ValueContainer";
import {PropertyConfiguration} from "./PropertyConfiguration";

export class Engine {
    public readonly globals: any;
    public readonly tickRate: string;
    private readonly references: any = [];
    private accumulatedTime: number = 0;
    private nextReferenceId: number = 0;
    static EngineSymbol: symbol = Symbol("Engine");

    constructor(configuration: EngineConfiguration) {
        if (configuration == undefined) {
            throw new Error("Missing configuration.");
        }
        this.globals = this.generateGlobals(configuration.globals);
        this.tickRate = configuration.tickRate || "one-second";
    }

    private generateGlobals(globals: { [p: string]: any } | undefined) {
        if (!globals) {
            return {};
        }
        return this.createReference({startingValue: globals});
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
        if (id !== null) {
            return this.references[id];
        }
    }

    public tick(interval: number) {
        const updater = this.globals[updaterSymbol];
        if (updater) {
            updater(this, interval);
        }
    }

    createReference(fromConfiguration: PropertyConfiguration, parent?: number) {
        const usedId = this.nextReferenceId++
        const newRef = ValueContainer(usedId, this, fromConfiguration, parent);
        this.references[usedId] = newRef;
        return newRef;
    }
}