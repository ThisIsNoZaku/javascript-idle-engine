import { PropertyConfiguration } from "./PropertyConfiguration";
import _ from "lodash";
import {reservedPropertyNames} from "./ValueContainer";
import {Engine} from "./Engine";

export class EngineConfiguration {
    public globals:{[name:string]: PropertyConfiguration } = {};
    public tickRate?:string = "one-second";

    public WithGlobalProperties(globals:{[name:string]: any }) {
        this.globals = Object.keys(globals).reduce((transformed: { [key:string]: PropertyConfiguration }, key) => {
            transformed[key] = this.transformToConfiguration(globals[key]);
            return transformed;
        }, {});
        return this;
    }

    private transformToConfiguration(configuration: any) {
        if(!(configuration instanceof PropertyConfiguration)) {
            if (_.isArray(configuration)) {
                configuration = new PropertyConfiguration(configuration.map(d => this.transformToConfiguration(d)));
            } else if (_.isObject(configuration)) {
                configuration = new PropertyConfiguration(Object.keys(configuration).reduce((transformed: any, key: string) => {
                    if(reservedPropertyNames.includes(key)) {
                        throw new Error(`${key} is a reserved keyword and not allowed as a property name`);
                    }
                    transformed[key] = this.transformToConfiguration(configuration[key])
                    return transformed;
                }, {}));
            } else {
                configuration = new PropertyConfiguration(configuration);
            }
        }
        return configuration;
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

    public static configProperty(startingValue?:any, updater?:(current:any, parent?:any, engine?: Engine)=>any): PropertyConfiguration{
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