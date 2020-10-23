import { Engine } from "./Engine";
import { ValueContainer } from "./ValueContainer";

const expectedProperties = [
    "startingValue",
    "updater"
]
export class PropertyConfiguration {
    startingValue?: any;
    updater?: ((current: any, parent?: ValueContainer, engine?: Engine) => any);
    public constructor(startingValue?:any, updater?: ((current: any, parent?: ValueContainer, engine?: Engine) => any)) {
        this.startingValue = startingValue;
        if(updater) {
            this.updater = updater;
        }
    }
}