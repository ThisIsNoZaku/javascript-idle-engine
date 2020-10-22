import { Engine } from "./Engine";
import { ValueContainer } from "./ValueContainer";

const expectedProperties = [
    "startingValue",
    "updater"
]
export interface PropertyConfiguration {
    startingValue?: any;
    updater?: ((engine: Engine, parent: (ValueContainer | null), current: any) => any);
}