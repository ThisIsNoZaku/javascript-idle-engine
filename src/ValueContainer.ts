import EventSource from "./EventSource";
import { Engine } from "./Engine";
import * as _ from "lodash";

export class ValueContainer implements EventSource{
    private readonly listeners:any = {};
    private readonly engine:Engine;
    private value:any;
    private readonly parentContainer:ValueContainer | null;
    private readonly updaterFunction: ((engine: Engine, parent:ValueContainer | null, previous:any) => any) | null;
    public constructor(engine: Engine, startingValue: any, parentContainer:ValueContainer | null, updaterFunction: ((engine: Engine, parent: ValueContainer | null, previous: any) => any) | null ) {
        this.parentContainer = parentContainer;
        this.updaterFunction = updaterFunction;
        this.engine = engine;
        if(_.isArray(startingValue)) {
            this.value = startingValue.map(i => new ValueContainer(engine, i, this, null));
        } else if(_.isObject(startingValue)) {
            this.value = Object.keys(startingValue).reduce((obj:any, key:string) => {
                obj[key] = new ValueContainer(engine, (<any>startingValue)[key], this, null);
                return obj;
            }, {});
        } else {
            this.value = startingValue;
        }
    }
    public get() {
        return this.value;
    }
    public set(value:any) {
        // TODO: Logging for when the type of the value changes to help debugging.
        this.value = value;
        this.notifyListeners("changed", this.value);
    }

    public on(eventName: string, callback: (engine: Engine, arg: any, parent?: ValueContainer) => void): void {
        if(this.listeners[eventName] === undefined) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    private notifyListeners(event:string, arg: any) {
        const eventListeners = this.listeners[event];
        if(eventListeners) {
            eventListeners.forEach((listener:(engine: Engine, arg:any, parent:ValueContainer | null) => void) => {
               listener(this.engine, arg, this.parentContainer);
            });
        }
    }

    public update(engine: Engine): void{
        if(this.updaterFunction) {
            this.set(this.updaterFunction(engine, this.parentContainer, this.value));
        }
    }
}