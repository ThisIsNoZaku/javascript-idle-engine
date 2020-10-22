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
            this.value = wrapArray(engine, this, <any[]>startingValue);
        } else if(_.isObject(startingValue)) {
            let containingValue = startingValue;
            this.value = Object.keys(startingValue).reduce((obj:any, key:string) => {
                obj[key] = new ValueContainer(engine, (<any>containingValue)[key].startingValue, this, null);
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
        if(_.isObject(this.value)) {
            _.isArray(this.value) ? this.value.forEach(av => av.update(engine)) : Object.values(this.value).forEach(av => av.update(engine));
        }
    }
}

function wrapArray(engine:Engine, parent: ValueContainer, array:any[]) {
    const transformed = array.map(i => new ValueContainer(engine, i.startingValue, parent, i.updater));
    let handler = {
        set: function (target:any[], propertyOrIndex:string, value:any) {
            const parsedIndex = Number.parseInt(propertyOrIndex);
            if(!Number.isNaN(parsedIndex)) {
                target[parsedIndex] = new ValueContainer(engine, value, parent, null);
            } else {
                (<any>target)[propertyOrIndex] = value;
            }
            return true;
        }

    };
    return new Proxy<any[]>(transformed, handler);
}