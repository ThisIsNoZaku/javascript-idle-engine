import {PropertyConfiguration, PropertyConfigurationBuilder} from "./PropertyConfiguration";
import _ from "lodash";
import {reservedPropertyNames} from "./ValueContainer";
import {Engine} from "./Engine";
import { Big } from "big.js";

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
        if(!(configuration instanceof PropertyConfigurationBuilder)) {
            if (_.isArray(configuration)) {
                configuration = new PropertyConfigurationBuilder(configuration.map(d => this.transformToConfiguration(d)));
            } else if (_.isObject(configuration) && configuration.constructor.name !== "Big") {
                configuration = new PropertyConfigurationBuilder(Object.keys(configuration).reduce((transformed: any, key: string) => {
                    if(reservedPropertyNames.includes(key)) {
                        throw new Error(`${key} is a reserved keyword and not allowed as a property name`);
                    }
                    transformed[key] = this.transformToConfiguration(configuration[key])
                    return transformed;
                }, {}));
            } else {
                configuration = new PropertyConfigurationBuilder(_.isNumber(configuration) ? Big(configuration) : configuration);
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

    public static configProperty(startingValue?:any, updater?:(current:any, parent?:any, engine?: Engine)=>any): PropertyConfigurationBuilder {
        if(_.isObject(startingValue)) {
            if(startingValue instanceof PropertyConfigurationBuilder) {
                return startingValue as PropertyConfigurationBuilder;
            }
            startingValue = _.isArray(startingValue) ? startingValue.map(x => this.configProperty(x)) : Object.keys(startingValue).reduce((transformed:any, next)=>{
                transformed[next] = this.configProperty((startingValue as any)[next]);
                return transformed;
            }, {});
        }
        if(_.isNumber(startingValue)) {
            startingValue = Big(startingValue);
        }
        return new PropertyConfigurationBuilder(startingValue, updater);
    }
}