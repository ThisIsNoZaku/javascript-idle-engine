import { Engine } from "./Engine";
import { ValueContainer } from "./ValueContainer";

const expectedProperties = [
    "startingValue",
    "updater"
]
export class PropertyConfiguration {
    private startingValue?: any;
    private updater?: null | ((engine: Engine, parent: (ValueContainer | null), current: any) => any);

    constructor(startingValue: any | null, updater: null | ((engine: Engine, parent:ValueContainer | null, current: any) => any)) {
        this.startingValue = startingValue;
        this.updater = updater;
    }
}