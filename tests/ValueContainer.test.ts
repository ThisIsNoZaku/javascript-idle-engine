import {ValueContainer} from "../src/ValueContainer";
import {Engine} from "../src/Engine";
import {EngineConfiguration} from "../src";
import instantiate = WebAssembly.instantiate;
import * as ts from "typescript/lib/tsserverlibrary";
import emptyArray = ts.server.emptyArray;

describe("ValueContainer", function () {
    let engine: Engine;
    beforeEach(() => engine = new Engine(new EngineConfiguration()));
    it("wraps a value", function () {
        const ref = new ValueContainer(1, <Engine>(<unknown>null), "string", null, null);
        expect(ref.get()).toEqual("string");
    });
    it("wraps all child values in an container", function () {
        const ref = new ValueContainer(1, engine, {
            string: {startingValue: "string"},
            number: {startingValue: 1},
            boolean: {startingValue: true}
        });
        expect(ref.get().string.get()).toEqual("string");
        expect(ref.get().number.get()).toEqual(1);
        expect(ref.get().boolean.get()).toEqual(true);
    });
    it("can be subscribed to", function () {
        const ref = new ValueContainer(1, engine, "string", null, null);
        ref.on("changed", function (arg) {
            expect(arg).toEqual("new");
        });
        ref.set("new");
        expect.hasAssertions();
    });
    it("setting a property on an object notifies the object's listeners", function () {
        const ref = new ValueContainer(1, engine, {});
        const changeCallback = jest.fn();
        ref.on("changed", changeCallback);
        ref.get().foo = 123;
        expect(changeCallback.mock.calls.length).toBe(1);
    })

});

describe("array ValueContainer", function () {

    let engine: Engine;
    beforeEach(() => engine = new Engine(new EngineConfiguration()
        .WithGlobalProperties({
                top: EngineConfiguration.configProperty({
                    middle: {
                        bottom: {}
                    }
                })
            }
        )));
    it("does not replace an array value with an object", function () {
        const ref = engine.createReference([]);
        expect(ref.get()).toEqual([]);
    });
    it("assigning to an index wraps the value", function () {
        const ref = engine.createReference([]);
        ref.get()[0] = 123
        expect(ref.get()[0] instanceof ValueContainer).toBeTruthy();
    });
    it("inserting an object via push wraps the value", function () {
        const ref = engine.createReference([]);
        ref.get().push(123);
        expect(ref.get()[0] instanceof ValueContainer).toBeTruthy();
        expect(ref.get()[0].get()).toBe(123);
    });
    it("assigning to an index that already has a wrapped value assigns to the wrapper instead of creating a new one", function () {
        const ref = engine.createReference([123]);
        const original = ref.get()[0];
        ref.get()[0] = 321;
        expect(ref.get()[0] === original).toBeTruthy();
    });
    it("inserting into an array notifies array listeners", function () {
        const topCallback = jest.fn();
        const middleCallback = jest.fn();
        const bottomCallback = jest.fn();
        engine.globals.top.on("changed", topCallback);
        engine.globals.top.get().middle.on("changed", middleCallback);
        engine.globals.top.get().middle.get().bottom.on("changed", bottomCallback);
        engine.globals.top.get().middle.get().bottom.set(123);

        expect(bottomCallback.mock.calls.length).toBe(1);
        expect(middleCallback.mock.calls.length).toBe(1);
        expect(topCallback.mock.calls.length).toBe(1);
    });
});