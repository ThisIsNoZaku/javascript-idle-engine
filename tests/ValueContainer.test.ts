import { ValueContainer } from "../src/ValueContainer";
import { Engine } from "../src/Engine";
import {EngineConfiguration} from "../src";
import instantiate = WebAssembly.instantiate;

describe("ValueContainer", function () {
    let engine:Engine;
    beforeEach(() => engine= new Engine(new EngineConfiguration()));
    it("wraps a value", function () {
        const ref = new ValueContainer(1, <Engine>(<unknown>null),"string", null, null);
        expect(ref.get()).toEqual("string");
    });
    it("wraps all child values in an container", function () {
        const ref = new ValueContainer(1, engine, {
            string: {startingValue:"string"},
            number: {startingValue: 1},
            boolean: {startingValue: true}
        }, null, null);
        expect(ref.get().string.get()).toEqual("string");
        expect(ref.get().number.get()).toEqual(1);
        expect(ref.get().boolean.get()).toEqual(true);
    });
    it("can be subscribed to", function () {
        const ref = new ValueContainer(1, engine, "string", null, null);
        ref.on("changed", function (engine, arg) {
            expect(arg).toEqual("new");
        });
        ref.set("new");
        expect.hasAssertions();
    });
    it("can defined an updater function which modifies its value each tick", function () {
        const ref = new ValueContainer(1,<Engine>(<unknown>null), "string", null, null);
    });

});

describe("array ValueContainer", function () {

    let engine:Engine;
    beforeEach(() => engine= new Engine(new EngineConfiguration()));
    it("does not replace an array value with an object", function() {
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
        const ref = engine.createReference([]);
        const callback = jest.fn();
        ref.on("changed", callback);
        ref.get()[0] = 123;
        expect(callback.mock.calls.length).toBe(1);
    })
});