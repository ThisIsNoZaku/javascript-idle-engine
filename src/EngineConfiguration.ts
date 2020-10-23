import { PropertyConfiguration } from "./PropertyConfiguration";
import _ from "lodash";
import {ValueContainer} from "./ValueContainer";
import {Engine} from "./Engine";

export class EngineConfiguration {
    public globals:{[name:string]: PropertyConfiguration } = {};
    public tickRate?:string = "one-second";

    public WithGlobalProperties(globals:{[name:string]: PropertyDeclaration }) {
        this.globals = Object.keys(globals).reduce((transformed: { [key:string]: PropertyConfiguration }, key) => {
            transformed[key] = this.transformToConfiguration(globals[key]);
            return transformed;
        }, {});
        return this;
    }

    private transformToConfiguration(declaration: PropertyDeclaration) {
        const config: any = _.isObject(declaration) && !_.isArray(declaration) ? <PropertyConfiguration>declaration : {
            startingValue: declaration
        };
        if(_.isArray(config.startingValue)) {
            config.startingValue = _.isArray(config.startingValue) ? config.startingValue.map(((i: any) => this.transformToConfiguration(i))) : config.startingValue
        } else if (_.isObject(config.startingValue)) {
            config.startingValue = Object.keys(config.startingValue).reduce((transformed: any, key:string) => {
                transformed[key] = this.transformToConfiguration(config.startingValue[key])
                return transformed;
            }, {});
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

    public static configProperty(startingValue?:any, updater?:(current:any, parent?:ValueContainer, engine?: Engine)=>any): PropertyConfiguration{
        if(_.isObject(startingValue)) {
            if(startingValue instanceof PropertyConfiguration) {
                return startingValue as PropertyConfiguration;
            }
            startingValue = _.isArray(startingValue) ? startingValue.map(x => this.configProperty(x)) : Object.keys(startingValue).reduce((transformed:any, next)=>{
                transformed[next] = this.configProperty((startingValue as any)[next]);
                return transformed;
            }, {});
        }
        return new PropertyConfiguration(startingValue, updater);
    }
}

type PropertyDeclaration = PropertyConfiguration | string | number | boolean | PropertyDeclaration[];