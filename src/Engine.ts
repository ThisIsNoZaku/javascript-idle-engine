import {EngineConfiguration} from "./EngineConfiguration";
import {updaterSymbol, ValueContainer} from "./ValueContainer";
import {PropertyConfiguration, PropertyConfigurationBuilder} from "./PropertyConfiguration";
import _ from "lodash";
import {Big} from "big.js";

export class Engine {
    public readonly globals: any;
    public readonly tickRate: string;
    private readonly references: any = [];
    private nextReferenceId: number = 0;
    private tickIntervalId?: NodeJS.Timeout;

    constructor(configuration: EngineConfiguration) {
        if (configuration == undefined) {
            throw new Error("Missing configuration.");
        }
        const postConfigurationHooks: Array<(engine: Engine) => void> = this.extractPostConfigurationHooks(configuration.globals, []);

        this.globals = this.generateGlobals(configuration.globals || {});

        this.tickRate = configuration.tickRate || "one-second";
        postConfigurationHooks.forEach(hook => {
            hook(this);
        });
    }

    private extractPostConfigurationHooks(configurationObject: { [prop: string]: any }, pathSoFar: string[]): any[] {
        const childHooks = _.isObject(configurationObject.startingValue) ? Object.keys(configurationObject.startingValue).flatMap(property => {
            return this.extractPostConfigurationHooks(configurationObject.startingValue[property], pathSoFar.concat([property]));
        }) : [];
        return childHooks.concat([function (engine: Engine) {
            if (configurationObject.postConfigurationHook) {
                const parent = _.get(engine.globals, pathSoFar.slice(0, pathSoFar.length - 1));
                const initialValue = _.get(engine.globals, pathSoFar);

                configurationObject.postConfigurationHook(initialValue, parent, engine);
            }}
        ]);
    }

    private generateGlobals(globals: PropertyConfiguration) {
        return this.createReference(globals);
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
        this.tickIntervalId = setInterval(this.tick.bind(this, interval), interval)
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

    pause() {
        if (this.tickIntervalId !== undefined) {
            clearInterval(this.tickIntervalId);
        }
    }
}