import { Engine } from "./Engine";
import { ValueContainer } from "./ValueContainer";

const expectedProperties = [
    "startingValue",
    "updater"
]
export interface PropertyConfiguration {
    startingValue?: any;
    updater?: ((current: any, parent?: ValueContainer, engine?: Engine) => any);
}