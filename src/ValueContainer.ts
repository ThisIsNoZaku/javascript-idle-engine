import EventSource from "./EventSource";
import { Engine } from "./Engine";
import * as _ from "lodash";

export class ValueContainer implements EventSource {
    [index: number] : any;
    [property: string] : any;
    public readonly id:number;
    private readonly listeners:{
        [eventName:string]: Array<(current?:any, parent?:ValueContainer, engine?: Engine ) => any>
    } = {};
    private value:any;
    private readonly parentContainer:number | null;
    private readonly updaterFunction?: ((engine: Engine, parent:ValueContainer | null, previous:any) => any) | null;
    public constructor(id:number, engine:Engine, startingValue: any, parentContainer?:ValueContainer | null, updaterFunction?: ((current: any, parent: ValueContainer | null, engine: Engine) => any) | null ) {
        this.id = id;
        this.parentContainer = parentContainer ? parentContainer.id : null;
        this.updaterFunction = updaterFunction;
        if(_.isObject(startingValue)) {
            this.value = this.wrapObject(engine, <any[]>startingValue);
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

    public on(eventName: string, callback: (arg?: any, parent?: ValueContainer, engine?: Engine) => void): any {
        if(this.listeners[eventName] === undefined) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
        return {
            unsubscribe: () => {
                this.removeListener(eventName, callback);
            }
        }
    }

    private removeListener(eventName:string, callback: (arg?: any, parent?: ValueContainer, engine?: Engine) => void): void {
        this.listeners[eventName] = this.listeners[eventName].filter(cb => cb != callback);
    }

    private notifyListeners(event:string, arg: any) {
        const eventListeners = this.listeners[event];
        if(eventListeners) {
            eventListeners.forEach((listener:(arg?:any, parent?:ValueContainer, engine?: Engine) => void) => {
               listener(arg, this.engine.getReference(this.parentContainer), this.engine);
            });
        }
    }

    public update(engine: Engine): void{
        if(this.updaterFunction) {
            this.set(this.updaterFunction(this.value, engine.getReference(this.parentContainer), engine));
        }
        if(_.isObject(this.value)) {
            _.isArray(this.value) ? this.value.forEach(av => av.update(engine)) : Object.values(this.value).forEach(av => av.update(engine));
        }
    }

    private static unwrappedProperties:string[] = ["length"];

    private wrapObject(engine:Engine, value:any) {
        const transformed = _.isArray(value) ? value.map(i => {
            const newRef = engine.createReference(i.startingValue, this, i.updater);
            newRef.on("changed", ()=> this.notifyListeners("changed", this.value))
            return newRef;
            }) :
            Object.keys(value).reduce((mapped:{[property:string]: ValueContainer}, property)=>{
                mapped[property] = engine.createReference(value[property].startingValue, this, value[property].updater);
                mapped[property].on("changed", ()=> this.notifyListeners("changed", this.value));
                return mapped;
            }, {});
        let handler = {
            set: (target:any, propertyOrIndex:string, value:any) => {
                if(!ValueContainer.unwrappedProperties.includes(propertyOrIndex)) {
                    if(target[propertyOrIndex] instanceof ValueContainer) {
                        target[propertyOrIndex].set(value);
                    } else {
                        target[propertyOrIndex] = engine.createReference(value, this);
                        target[propertyOrIndex].on("changed", this.notifyListeners.bind(this, "changed", this.value));
                        this.notifyListeners("changed", this.value);
                    }
                } else {
                    (<any>target)[propertyOrIndex] = value;
                }
                return true;
            }

        };
        return new Proxy<any>(transformed, handler);
    }
}