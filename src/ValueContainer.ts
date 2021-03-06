import {Engine} from "./Engine";
import * as _ from "lodash";
import {PropertyConfiguration} from "./PropertyConfiguration";
import {ChangeListener} from "./ChangeListener";
import {EngineConfiguration} from "./EngineConfiguration";
import {Big} from "big.js";
import {shallowEqualObjects} from "shallow-equal";

const interceptedProperties: any[] = ["watch", "push", "__proxy__"];
export const reservedPropertyNames = ["on", "watch", "startingValue"];
export const changeListeners = Symbol.for("listeners");
export const referenceIdSymbol = Symbol.for("id");
export const updaterSymbol = Symbol.for("property-updaters");
export const lastUpdateValue = Symbol.for("last-updated");
const childListeners = Symbol.for("child-listeners");

function generateUpdaterFor(wrappedValue: any) {
    return (engine: Engine, deltaTime: DOMHighResTimeStamp) => {
        Object.keys(wrappedValue).forEach(child => {
            // Call updater function, if any for the child;
            const updater = wrappedValue[updaterSymbol][child];
            if (updater) {
                let newValue = updater(wrappedValue[child], wrappedValue, engine, deltaTime);
                if (newValue === undefined) {
                    throw new Error("An updater method returned undefined, which is not allowed. A method must return a value, return null if 'nothing' is a valid result.");
                }
                if (_.isNumber(newValue)) {
                    newValue = Big(newValue);
                } else if (_.isObject(newValue) && newValue.constructor.name !== "Big" && !(<any>newValue).__proxy__) {
                    newValue = engine.createReference(EngineConfiguration.configProperty(newValue), wrappedValue);
                }
                wrappedValue[child] = newValue;
                const newAndOldNumbers = _.isObject(newValue) && _.isObject(updater[lastUpdateValue])
                    && newValue.constructor.name === 'Big' && updater[lastUpdateValue].constructor.name === "Big";
                if ((newAndOldNumbers && !(<Big>newValue).eq(updater[lastUpdateValue])) || (!newAndOldNumbers && !shallowEqualObjects(newValue, updater[lastUpdateValue]))) {
                    updater[lastUpdateValue] = newValue;
                    wrappedValue[changeListeners].forEach((listener: any) => {
                        listener(child, newValue, wrappedValue, engine);
                    });
                }
            }
            if (_.isObject(wrappedValue[child]) && wrappedValue[child].constructor.name !== "Big" && !_.isFunction(wrappedValue[child])) {
                wrappedValue[child][updaterSymbol](engine, deltaTime);
            }
        });
    }
}

function initialConfiguration(id: number, configuration: PropertyConfiguration, parent: any | undefined, engine: Engine) {
    const initialValue: any = _.isArray(configuration.startingValue) ? [] : {};
    initialValue[changeListeners] = configuration.listeners || [];
    initialValue[updaterSymbol] = generateUpdaterFor(initialValue);
    initialValue[childListeners] = {};
    Object.keys(configuration.startingValue).forEach((prop: string) => {
        if (configuration.startingValue[prop].updater) { // Attach the updater for this property
            initialValue[updaterSymbol][prop] = configuration!.startingValue[prop].updater;
        }
        if (_.isObject(configuration.startingValue[prop].startingValue) && configuration.startingValue[prop].startingValue.constructor.name !== "Big" && typeof configuration.startingValue[prop].startingValue !== "function") {
            initialValue[prop] = engine.createReference(configuration!.startingValue[prop], id);
            subscribeToChild(initialValue, prop, initialValue[prop]);
        } else {
            initialValue[prop] = _.isNumber(configuration.startingValue[prop].startingValue)
                ? Big(configuration.startingValue[prop].startingValue) :
                configuration.startingValue[prop].startingValue;
        }
    });
    return initialValue;
}

function subscribeToChild(parent: any, childProp: string | symbol | number, child: any) {
    const childListener = (changedProperty: string, value: any, p: any, engine: Engine) => {
        parent[changeListeners].forEach((listener: any) => {
            listener(childProp, parent[childProp], parent, engine);
        });
    };
    parent[childListeners][childProp] = child.watch(childListener);
}

export function ValueContainer(id: number, engine: Engine, configuration: PropertyConfiguration, parent?: any) {
    let wrappedValue: any = initialConfiguration(id, configuration, parent, engine);
    if (!_.isObject(configuration.startingValue)) {
        throw new Error("Cannot wrap non-object values");
    }

    const handler = {
        get: function (target: any, prop: string | number | symbol, receiver: any) {
            if (interceptedProperties.includes(prop)) {
                switch (prop) {
                    case "__proxy__":
                        return true;
                    case "watch":
                        return (listener: ChangeListener) => {
                            if (typeof listener !== "function") {
                                throw new Error("Tried to call watch with a non-function argument.");
                            }
                            wrappedValue[changeListeners].push(listener);
                            return {
                                unsubscribe: function () {
                                    wrappedValue[changeListeners] = wrappedValue[changeListeners].filter((l: any) => l !== listener);
                                }
                            }
                        };
                    case "push":
                        if (wrappedValue && wrappedValue.push) {
                            return (value: any) => {
                                wrappedValue.push(transformIncomingValue(target, prop, value, engine));
                                wrappedValue[changeListeners].forEach((listener: any) => listener(wrappedValue.length - 1, value));
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
            if (_.isObject(wrappedValue[prop]) && wrappedValue[prop].constructor.name !== "Big") {
                wrappedValue[childListeners][prop].unsubscribe();
                delete wrappedValue[childListeners][prop]; // Unsubscribe from the child
            }
            wrappedValue[prop] = transformIncomingValue(target, prop, incomingValue, engine);
            // notify listeners watching this property
            wrappedValue[changeListeners].forEach((listener: any) => listener(prop, wrappedValue[prop], wrappedValue, engine));
            return true;
        }
    };
    wrappedValue[referenceIdSymbol] = id;
    return new Proxy(wrappedValue, handler);
}

function transformIncomingValue(target: any, prop: string | number | symbol, incomingValue: any, engine: Engine) {
    let actualValue = incomingValue;
    if (_.isObject(incomingValue) && incomingValue.constructor.name !== "Big") {
        if (!(<any>incomingValue).__proxy__) {
            actualValue = engine.createReference(EngineConfiguration.configProperty(incomingValue));
        }
        subscribeToChild(target, prop, actualValue);
    } else {
        if (_.isNumber(incomingValue)) {
            actualValue = Big(incomingValue);
        } else {
            actualValue = incomingValue;
        }
    }
    return actualValue;
}