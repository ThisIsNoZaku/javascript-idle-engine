import EventSource from "./EventSource";
import { Engine } from "./Engine";
import * as _ from "lodash";

export class ValueContainer implements EventSource{
    private readonly id:number;
    private readonly listeners:any = {};
    private readonly engine:Engine;
    private value:any;
    private readonly parentContainer:number | null;
    private readonly updaterFunction?: ((engine: Engine, parent:ValueContainer | null, previous:any) => any) | null;
    public constructor(id:number, engine: Engine, startingValue: any, parentContainer?:ValueContainer | null, updaterFunction?: ((current: any, parent: ValueContainer | null, engine: Engine) => any) | null ) {
        this.id = id;
        this.parentContainer = parentContainer ? parentContainer.id : null;
        this.updaterFunction = updaterFunction;
        this.engine = engine;
        if(_.isArray(startingValue)) {
            this.value = wrapArray(engine, this, <any[]>startingValue);
        } else if(_.isObject(startingValue)) {
            let containingValue = startingValue;
            this.value = Object.keys(startingValue).reduce((obj:any, key:string) => {
                obj[key] = engine.createReference((<any>containingValue)[key].startingValue, this, (<any>containingValue)[key].updater);
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
               listener(this.engine, arg, this.engine.getReference(this.parentContainer));
            });
        }
    }

    public update(engine: Engine): void{
        if(this.updaterFunction) {
            this.set(this.updaterFunction(engine, engine.getReference(this.parentContainer), this.value));
        }
        if(_.isObject(this.value)) {
            _.isArray(this.value) ? this.value.forEach(av => av.update(engine)) : Object.values(this.value).forEach(av => av.update(engine));
        }
    }
}

function wrapArray(engine:Engine, parent: ValueContainer, array:any[]) {
    const transformed = array.map(i => engine.createReference(i.startingValue, parent, i.updater));
    let handler = {
        set: function (target:any[], propertyOrIndex:string, value:any) {
            const parsedIndex = Number.parseInt(propertyOrIndex);
            if(!Number.isNaN(parsedIndex)) {
                if(target[parsedIndex] instanceof ValueContainer) {
                    target[parsedIndex].set(value);
                } else {
                    target[parsedIndex] = engine.createReference(value, parent);
                }
            } else {
                (<any>target)[propertyOrIndex] = value;
            }
            return true;
        }

    };
    return new Proxy<any[]>(transformed, handler);
}