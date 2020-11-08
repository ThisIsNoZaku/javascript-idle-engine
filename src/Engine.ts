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
    private lastTimestamp?:DOMHighResTimeStamp;
    private state: string = "inactive";

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
            }
        }
        ]);
    }

    private generateGlobals(globals: PropertyConfiguration) {
        return this.createReference(globals);
    }

    public start() {
        if (this.state !== "running") {
            requestAnimationFrame(this.tick.bind(this));
            this.state = "running";
        }
    }

    public tick(timestamp: DOMHighResTimeStamp) {

        const timeSinceLastTimestamp = timestamp - (this.lastTimestamp || 0);
        if(timeSinceLastTimestamp > 50 || this.lastTimestamp === undefined) {
            if(this.lastTimestamp == null) {
                this.lastTimestamp = timestamp;
            }
            if(this.state === "running") {
                const updater = this.globals[updaterSymbol];
                if (updater) {
                    updater(this, timeSinceLastTimestamp);
                }
            }
            this.lastTimestamp = timestamp;
        }
        requestAnimationFrame(this.tick.bind(this));
    }

    createReference(fromConfiguration: PropertyConfiguration, parent?: number) {
        const usedId = this.nextReferenceId++
        const newRef = ValueContainer(usedId, this, fromConfiguration, parent);
        this.references[usedId] = newRef;
        return newRef;
    }

    pause() {
        this.state = "paused";
    }
}