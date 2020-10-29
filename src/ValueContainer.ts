import EventSource from "./EventSource";
import {Engine} from "./Engine";
import * as _ from "lodash";
import {PropertyConfiguration} from "./PropertyConfiguration";
import {ChangeListener} from "./ChangeListener";

const interceptedMethods: any[] = ["watch", "push"];
export const reservedPropertyNames = ["on", "watch", "startingValue"];
export const changeListeners = Symbol.for("listeners");
export const referenceIdSymbol = Symbol.for("id");
export const updaterSymbol = Symbol.for("property-updaters");
const childListeners = Symbol.for("child-listeners");

function generateUpdaterFor(wrappedValue: any) {
    return (engine: Engine) => {
        Object.keys(wrappedValue).forEach(child => {
            // Call updater function, if any for the child;
            const updater = wrappedValue[updaterSymbol][child];
            if (updater) {
                const newValue = updater(wrappedValue[child], wrappedValue, engine);
                if (newValue === undefined) {
                    throw new Error("An updater method returned undefined, which is not allowed. A method must return a value, return null if 'nothing' is a valid result.");
                }
                wrappedValue[child] = newValue;
                wrappedValue[changeListeners].forEach((listener:any) => {
                    listener(child, newValue);
                })
            }
            if (_.isObject(wrappedValue[child])) {
                wrappedValue[child][updaterSymbol](engine);
            }
        });
    }
}

function initialConfiguration(id: number, configuration: PropertyConfiguration, parent: any | undefined, engine: Engine) {
    const initialValue:any = _.isArray(configuration.startingValue) ? [] : {};
    initialValue[changeListeners] = [];
    initialValue[updaterSymbol] = generateUpdaterFor(initialValue);
    initialValue[childListeners] = {};
    Object.keys(configuration.startingValue).forEach((prop: string) => {
        if (configuration!.startingValue[prop].updater) { // Attach the updater for this property
            initialValue[updaterSymbol][prop] = configuration!.startingValue[prop].updater;
        }
        if(_.isObject(configuration.startingValue[prop].startingValue)) {
            initialValue[prop] = engine.createReference(configuration!.startingValue[prop], id);
            subscribeToChild(initialValue, prop, initialValue[prop]);
        } else {
            initialValue[prop] = configuration.startingValue[prop].startingValue;
        }
    })
    return initialValue;
}

function subscribeToChild(parent:any, childProp:string | number, child:any) {
    const childListener = (changedProperty:string, value:any) => {
        parent[changeListeners].forEach((listener:any) => {
            listener(childProp, parent);
        });
    };
    parent[childListeners][childProp] = child.watch(childListener);
}

export function ValueContainer(id: number, engine: Engine, configuration: PropertyConfiguration, parent?: any) {
    let wrappedValue: any = initialConfiguration(id, configuration, parent, engine);
    if(!_.isObject(configuration.startingValue)) {
        throw new Error("Cannot wrap non-object values");
    }

    const handler = {
        get: function (target: any, prop: string | number | symbol, receiver: any) {
            if (interceptedMethods.includes(prop)) {
                switch (prop) {
                    case "__proxy__":return true;
                    case "watch":
                        return (listener: ChangeListener) => {
                            if(typeof listener !== "function") {
                                throw new Error("Tried to call watch with a non-function argument.");
                            }
                            wrappedValue[changeListeners].push(listener);
                            return {
                                unsubscribe: function () {
                                    wrappedValue[changeListeners] = wrappedValue[changeListeners].filter((l:any) => l !== listener);
                                }
                            }
                        };
                    case "push":
                        if (wrappedValue && wrappedValue.push) {
                            return (value: any) => {
                                wrappedValue.push(_.isObject(value) ? engine.createReference({
                                    startingValue: value
                                }, target) : value);
                            }
                        } else {
                            return undefined; // Don't return the function if the value doesn't define it.
                        }
                }
            }
            if (typeof wrappedValue[prop] === "function") {
                return wrappedValue[prop].bind(wrappedValue);
            }
            return wrappedValue[prop];
        },
        set: function (target: any, prop: string | number, incomingValue: any, receiver: any) {
            if(_.isObject(wrappedValue[prop])) {
                wrappedValue[childListeners][prop].unsubscribe();
                delete wrappedValue[childListeners][prop]; // Unsubscribe from the child
            }
            let actualValue:any;
            if(_.isObject(incomingValue)) {
                if(!(<any>incomingValue).__proxy__) {
                    actualValue = engine.createReference({
                        startingValue: incomingValue
                    });
                }
                subscribeToChild(target, prop, actualValue);
            } else {
                actualValue = incomingValue;
            }
            wrappedValue[prop] = actualValue;
            // notify listeners watching this property
            wrappedValue[changeListeners].forEach((listener:any) => listener(prop, incomingValue));
            return true;
        }
    };
    wrappedValue[referenceIdSymbol] = id;
    return new Proxy(wrappedValue, handler);
}