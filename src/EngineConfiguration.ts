import { PropertyConfiguration } from "./PropertyConfiguration";
import _ from "lodash";

export class EngineConfiguration {
    public globals:{[name:string]: PropertyConfiguration } = {};
    public tickRate:string = "one-second";
    constructor() {

    }

    public transformObject(globals:{[name:string]: PropertyDeclaration }) {
        this.globals = Object.keys(globals).reduce((transformed: { [key:string]: PropertyConfiguration }, key) => {
            transformed[key] = this.transformToConfiguration(globals[key]);
            return transformed;
        }, {});
        return this;
    }

    private transformToConfiguration(declaration: PropertyDeclaration) {
        const config: any = _.isObject(declaration) ? <PropertyConfiguration>declaration : {
            startingValue: declaration
        };
        if(_.isArray(config.startingValue)) {
            config.startingValue = _.isArray(config.startingValue) ? config.startingValue.map((i => this.transformToConfiguration(i))) : config.startingValue
        } else if (_.isObject(config.startingValue)) {
            config.startingValue = this.transformObject(config.startingValue);
        }
        return config;
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

type PropertyDeclaration = PropertyConfiguration | string | number | boolean | PropertyDeclaration[];