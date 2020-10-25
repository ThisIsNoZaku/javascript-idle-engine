import EventSource from "./EventSource";
import {Engine} from "./Engine";
import * as _ from "lodash";
import {PropertyConfiguration} from "./PropertyConfiguration";

export const reservedPropertyNames: any[] = ["set", "get", "on", "valueOf", "startingValue"];
const interceptedMethods: any[] = ["set", "get", "on", "push"];
export const listenersSymbol = Symbol.for("listeners");
export const referenceIdSymbol = Symbol.for("id");
export const updaterSymbol = Symbol.for("update");

function callListeners(container: any, eventName: string, engine: Engine) {
    return (arg: any) => {
        const allListeners = container[listenersSymbol];
        if (allListeners) {
            const actionListeners = allListeners[eventName];
            if (actionListeners) {
                actionListeners.forEach((listener: any) => {
                    listener(container.value, container, engine);
                })
            }
        }
    }
}

export function ValueContainer(id: number, engine: Engine, configuration?: PropertyConfiguration, parentId?: any) {
    if (!configuration) {
        configuration = {
            startingValue: null
        };
    }
    let container: any = {};
    if (_.isObject(configuration.startingValue)) {
        reservedPropertyNames.forEach(reserved => {
            if (Object.keys(configuration!.startingValue).includes(reserved)) {
                throw new Error(`${reserved} is a reserved property and cannot be defined in an object.`);
            }
        });
        if (_.isArray(configuration.startingValue)) {
            container.value = [];
            configuration.startingValue.forEach(i => {
                const childReference = engine.createReference(i, container.value);
                childReference.on("changed", callListeners(container, "changed", engine).bind(container.value));
                container.value.push(childReference);
            })
        } else {
            container.value = Object.keys(configuration.startingValue).reduce((wrapped: any, prop: string) => {
                wrapped[prop] = engine.createReference(configuration!.startingValue[prop], id);
                wrapped[prop].on("changed", callListeners(container, "changed", engine).bind(container.value));
                return wrapped;
            }, {})
        }
    } else {
        container.value = configuration.startingValue;
    }

    const handler = {
        get: function (target: any, prop: string | number, receiver: any) {
            if (_.isSymbol(prop)) {
                if(prop == updaterSymbol) {
                    return () => {
                        if(_.isObject(container.value)) {
                            Object.values(container.value).forEach((child:any) => child[updaterSymbol]());
                        }
                        if(configuration!.updater) {
                            container.value = configuration!.updater(container.value, engine.getReference(parentId), engine);
                        }
                    }
                }
                return container[updaterSymbol]
            }
            if (interceptedMethods.includes(prop)) {
                switch (prop) {
                    case "set":
                        return (value: any) => {
                            container.value = value;
                            callListeners(container, "changed", engine)(container.value);
                        }
                    case "get":
                        return () => {
                            return container.value;
                        }
                    case "on":
                        return (event: string, listener: (value: any, parent?: any, engine?: Engine) => void) => { // FIXME: Define a type for these updater/listener functions.
                            let allListeners = target[listenersSymbol];
                            if (!allListeners) {
                                allListeners = {};
                                target[listenersSymbol] = allListeners;
                            }
                            let eventListeners = allListeners[event];
                            if (!eventListeners) {
                                eventListeners = [];
                                allListeners[event] = eventListeners;
                            }
                            eventListeners.push(listener);
                            return {
                                unsubscribe: () => {
                                    allListeners[event] = eventListeners.filter((addedListener: (value: any, parent?: any, engine?: Engine) => void) => addedListener != listener)
                                }
                            }
                        }
                    case "push":
                        if (container.value && container.value.push) {
                            return (value: any) => {
                                container.value.push(engine.createReference({
                                    startingValue: value
                                }, target));
                            }
                        } else {
                            return undefined; // Don't return the function if the value doesn't define it.
                        }
                }
            }
            if (container.value === undefined) {
                container.value = {};
            }
            if (container.value[prop] === undefined) {
                const newChild = engine.createReference({}, container.value);
                newChild.on("changed", callListeners(container, "changed", engine))
                container.value[prop] = newChild;
            }

            return container.value[prop];
        }
    };
    container[referenceIdSymbol] = id;
    return new Proxy(container, handler);
}