import {ValueContainer} from "../src/ValueContainer";
import {Engine} from "../src/Engine";
import {EngineConfiguration} from "../src";
import * as ts from "typescript/lib/tsserverlibrary";

describe("ValueContainer", function () {
    let engine: Engine;
    beforeEach(() => engine = new Engine(new EngineConfiguration()));
    it("can wrap a primitive value which can be retrieved by get", function () {
        const stringRef = ValueContainer(1, <Engine>(<unknown>null), {
            startingValue: "string"
        });
        const numRef = ValueContainer(1, <Engine>(<unknown>null), {
            startingValue: 1
        });
        const boolRef = ValueContainer(1, <Engine>(<unknown>null), {
            startingValue: true
        });
        expect(stringRef.get()).toEqual("string");
        expect(numRef.get()).toEqual(1);
        expect(boolRef.get()).toEqual(true);
    });
    it("can change the wrapped value via set", function () {
        const ref = ValueContainer(1, <Engine>(<unknown>null), {});
        expect(ref.get()).toBeUndefined();
        ref.set(123);
        expect(ref.get()).toBe(123);
    });
    it("wraps all child values in an container", function () {
        const ref = ValueContainer(1, engine, {
            startingValue: {
                string: {startingValue: "string"},
                number: {startingValue: 1},
                boolean: {startingValue: true}
            }
        });
        expect(ref.string.get()).toEqual("string");
        expect(ref.number.get()).toEqual(1);
        expect(ref.boolean.get()).toEqual(true);
    });
    it("can be subscribed to", function () {
        const ref = ValueContainer(1, engine, {startingValue: "string"});
        ref.on("changed", function (arg: any) {
            expect(arg).toEqual("new");
        });
        ref.set("new");
        expect.hasAssertions();
    });
    it("setting a property on an object notifies the object's listeners", function () {
        const ref = ValueContainer(1, engine, {});
        const changeCallback = jest.fn();
        ref.on("changed", changeCallback);
        ref.foo.set(123);
        expect(changeCallback.mock.calls.length).toBe(1);
    })

});

describe("array ValueContainer", function () {

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
        expect([...ref.get()]).toEqual([]);
    });
    it("assigning to an index wraps the value", function () {
        const ref = engine.createReference({
            startingValue: []
        });
        ref.get()[0] = 123
        expect(ref.get()[0]).toBe(123);
    });
    it("inserting an object via push wraps the value", function () {
        const ref = engine.createReference({startingValue: []});
        ref.push(123);
        expect(ref[0].get()).toBe(123);
    });
    it("assigning to an index that already has a wrapped value assigns to the wrapper instead of creating a new one", function () {
        const ref = engine.createReference({startingValue: [123]});
        const original = ref[0];
        ref[0].set(321);
        expect(ref.get()[0] === original).toBeTruthy();
    });
    it("modifying an object notifies all parent listeners", function () {
        const topCallback = jest.fn();
        const middleCallback = jest.fn();
        const bottomCallback = jest.fn();
        engine.globals.top.on("changed", topCallback);
        engine.globals.top.middle.on("changed", middleCallback);
        engine.globals.top.middle.get().bottom.on("changed", bottomCallback);
        engine.globals.top.middle.bottom.set(123);

        // FIXME: Find a way to test arguments are correct. The ValueContainer proxy causes problems with asserting.
        expect(bottomCallback.mock.calls.length).toBe(1);
        expect(middleCallback.mock.calls.length).toBe(1);
        expect(topCallback.mock.calls.length).toBe(1);
    });

    it("modifying an object notifies all parent listeners", function () {
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
        engine.globals.top.on("changed", topCallback);
        engine.globals.top[0].on("changed", middleCallback);
        engine.globals.top[0][0].on("changed", bottomCallback);
        engine.globals.top[0][0][0].on("changed", absoluteBottonCallback);
        engine.globals.top[0][0][0].set(1);

        expect(bottomCallback.mock.calls.length).toBe(1);
        expect(middleCallback.mock.calls.length).toBe(1);
        expect(topCallback.mock.calls.length).toBe(1);
    });
});