import {changeListeners, updaterSymbol, ValueContainer} from "../src/ValueContainer";
import {Engine} from "../src/Engine";
import {EngineConfiguration} from "../src";
import {Big} from "big.js";

describe("ValueContainer wrapping a primitive", function () {
    let engine: Engine;
    beforeAll(() => {
        global.requestAnimationFrame = function (callback: any) {
            setTimeout(() => {
                callback(1);
            });
            return 0;
        }
    });
    beforeEach(() => {
        engine = new Engine(new EngineConfiguration());

    });
    it("can wrap an object", function () {
        const ref = ValueContainer(1, <Engine>(<unknown>null), {startingValue: {}});
        expect(ref).toMatchObject({});
    });
    it("throws an error when trying to wrap a primitive", function () {
        expect(() => ValueContainer(1, <Engine>(<unknown>null), {startingValue: 1})).toThrow();
        expect(() => ValueContainer(1, <Engine>(<unknown>null), {startingValue: true})).toThrow();
        expect(() => ValueContainer(1, <Engine>(<unknown>null), {startingValue: "string"})).toThrow();
    });
    it("wraps all child values", function () {
        const ref = ValueContainer(1, engine, {
            startingValue: {
                string: {startingValue: "string"},
                number: {startingValue: 1},
                boolean: {startingValue: true}
            }
        });
        expect(ref.string).toEqual("string");
        expect(ref.number).toEqual(Big(1));
        expect(ref.boolean).toEqual(true);
    });
    it("properties of the object can be subscribed to", function () {
        const ref = ValueContainer(1, engine, {startingValue: {}});
        const listener = jest.fn();
        ref.watch(listener);
        ref.foo = "new";
        expect(listener).toHaveBeenCalledWith("foo", "new", expect.objectContaining(ref), engine);
    });
    it("when a child object changes, that objects parents are notified as well", function () {
        const ref = ValueContainer(1, engine, {
            startingValue: {
                child: {
                    startingValue: {}
                }
            }
        });
        const parentListener = jest.fn();
        ref.watch(parentListener);
        ref.child.property = "123";
        expect(parentListener.mock.calls[0][0]).toBe("child")
        expect(parentListener.mock.calls[0][1]).toMatchObject({
            property: "123"
        });
    });
    it("if update does not change a primitive value, it does not notify parents", function () {
        const ref = ValueContainer(1, engine, {
            startingValue: {
                property: EngineConfiguration.configProperty(0).withUpdater((current => current))
            }
        });
        const listener = jest.fn();
        ref.watch(listener);
        (<any>engine).state = "running";
        ref[updaterSymbol](engine, 100);
        ref[updaterSymbol](engine, 100);
        expect(listener).toHaveBeenCalledTimes(1);
    });
    it("if update does not change an object value, it does not notify parents", function () {
        const ref = ValueContainer(1, engine, {
            startingValue: {
                property: EngineConfiguration.configProperty({}).withUpdater((current => current))
            }
        });
        const listener = jest.fn();
        ref.watch(listener);
        ref[updaterSymbol](engine, 100);
        ref[updaterSymbol](engine, 100);
        expect(listener).toHaveBeenCalledTimes(1);
    });
    it("subscriptions to the container can be removed", function () {
        const ref = ValueContainer(1, engine, {startingValue: {}});
        const changeCallback = jest.fn();
        const subscription = ref.watch(changeCallback);
        subscription.unsubscribe();
        ref.property = 123;
        expect(changeCallback).not.toHaveBeenCalled();
    });
    it("if a child object is replaced, the parent no longer receives change notifications about it", function () {
        const ref = ValueContainer(1, engine, {
            startingValue: {
                child: {
                    startingValue: {}
                }
            }
        });
        const changeCallback = jest.fn();
        const firstChild = ref.child;
        ref.child.watch(changeCallback);
        ref.child = {};
        ref.child.foo = "bar";
        expect(changeCallback).not.toHaveBeenCalled();
        expect(firstChild[changeListeners].length).toBe(1);
    });
});

describe("array ValueContainer", function () {
    beforeAll(() => {
        global.requestAnimationFrame = function (callback: any) {
            setTimeout(() => {
                callback(1);
            });
            return 0;
        }
    });
    let engine: Engine;
    beforeEach(() => engine = new Engine(new EngineConfiguration()
        .WithGlobalProperties({
                top: {
                    middle: {
                        bottom: {}
                    }
                }
            }
        )));
    it("does not replace an array value with an object", function () {
        const ref = engine.createReference({
            startingValue: []
        });
        expect([...ref]).toEqual([]);
    });
    it("assigning to an index wraps the value", function () {
        const ref = engine.createReference({
            startingValue: []
        });
        ref[0] = 123
        expect(ref[0]).toEqual(Big(123));
    });
    it("inserting an object via push wraps the value", function () {
        const ref = engine.createReference({startingValue: []});
        ref.push(123);
        expect(ref[0]).toEqual(Big(123));
    });
    it("assigning to an index that already has a wrapped value assigns to the wrapper instead of creating a new one", function () {
        const ref = engine.createReference({startingValue: [123]});
        ref[0] = 321;
        expect([...ref]).toMatchObject([Big(321)])
    });
    it("modifying an object notifies all parent listeners", function () {
        const topCallback = jest.fn();
        const middleCallback = jest.fn();
        engine.globals.top.watch(topCallback);
        engine.globals.top.middle.watch(middleCallback);
        engine.globals.top.middle.bottom = 123;

        expect(middleCallback.mock.calls.length).toBe(1);
        expect(middleCallback.mock.calls[0][0]).toEqual("bottom")
        expect(middleCallback.mock.calls[0][1]).toEqual(Big(123))
        expect(topCallback.mock.calls.length).toBe(1);
        expect(topCallback.mock.calls[0][0]).toEqual("middle");
        expect(topCallback.mock.calls[0][1].bottom).toEqual(Big(123));
    });

    it("modifying an array notifies all parent listeners", function () {
        engine = new Engine(new EngineConfiguration()
            .WithGlobalProperties({
                    top:
                        [
                            [
                                [0]
                            ]
                        ]
                }
            ));
        const topCallback = jest.fn();
        const middleCallback = jest.fn();
        const bottomCallback = jest.fn();
        const absoluteBottonCallback = jest.fn();
        engine.globals.top.watch(topCallback);
        engine.globals.top[0].watch(middleCallback);
        engine.globals.top[0][0].watch(bottomCallback);
        engine.globals.top[0][0][0] = Big(1);

        expect(bottomCallback.mock.calls.length).toBe(1);
        expect(middleCallback.mock.calls.length).toBe(1);
        expect(topCallback.mock.calls.length).toBe(1);
    });
    it("calling update calls update on children", function () {
        const topUpdater = jest.fn(arg => arg);
        const middleUpdater = jest.fn(arg => arg);
        const bottomUpdater = jest.fn(arg => arg);
        engine = new Engine(new EngineConfiguration()
            .WithGlobalProperties({
                    top: EngineConfiguration.configProperty({
                        middle: EngineConfiguration.configProperty({
                            bottom: EngineConfiguration.configProperty(null).withUpdater(bottomUpdater)
                        }).withUpdater(middleUpdater)
                    }).withUpdater(topUpdater)
                }
            ));
        (<any>engine).state = "running";
        engine.tick(0);
        engine.tick(100);
        expect(topUpdater).toHaveBeenCalled();
        expect(middleUpdater).toHaveBeenCalled();
        expect(bottomUpdater).toHaveBeenCalled();
    });
});