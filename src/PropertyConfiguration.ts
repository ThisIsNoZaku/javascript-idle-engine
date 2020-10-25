import { Engine } from "./Engine";
import { reservedPropertyNames } from "./ValueContainer";
import _ from "lodash";

const expectedProperties = [
    "startingValue",
    "updater"
]

/**
 * The configuration of a
 */
export class PropertyConfiguration {
    startingValue?: any;
    updater?: ((current: any, parent?: any, engine?: Engine) => any);
    public constructor(startingValue?:any, updater?: ((current: any, parent?: any, engine?: Engine) => any)) {
        if(_.isObject(startingValue)) {
            Object.keys(startingValue).forEach(prop => {
                if(reservedPropertyNames.includes(prop)) {
                    throw new Error(`${prop} is a reserved keyword and not allowed as a property.`);
                }
            });
        }
        this.startingValue = startingValue;
        if(updater) { // Makes testing easier by keeping the updater property off the object.
            this.updater = updater;
        }
    }
}