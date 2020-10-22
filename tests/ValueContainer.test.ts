import { ValueContainer } from "../src/ValueContainer";
import { Engine } from "../src/Engine";

describe("ValueContainer", function () {
    it("wraps a value", function () {
        const ref = new ValueContainer(<Engine>(<unknown>null),"string", null, null);
        expect(ref.get()).toEqual("string");
    });
    it("wraps all child values in an container", function () {
        const ref = new ValueContainer(<Engine>(<unknown>null), {
            string: "string",
            number: 1,
            boolean: true
        }, null, null);
        expect(ref.get().string.get()).toEqual("string");
        expect(ref.get().number.get()).toEqual(1);
        expect(ref.get().boolean.get()).toEqual(true);
    });
    it("can be subscribed to", function () {
        const ref = new ValueContainer(<Engine>(<unknown>null), "string", null, null);
        ref.on("changed", function (engine, arg) {
            expect(arg).toEqual("new");
        });
        ref.set("new");
        expect.hasAssertions();
    });
    it("can defined an updater function which modifies its value each tick", function () {
        const ref = new ValueContainer(<Engine>(<unknown>null), "string", null, null);
    });

});

describe("array ValueContainer", function () {
    it("does not replace an array value with an object", function() {
        const ref = new ValueContainer(<Engine>(<unknown>null), [], null, null);
        expect(ref.get()).toEqual([]);
    });
    it("assigning to an index wraps the value", function () {
        const ref = new ValueContainer(<Engine>(<unknown>null), [], null, null);
        ref.get()[0] = 123
        expect(ref.get()[0]).toEqual(new ValueContainer(<Engine>(<unknown>null), 123, ref, null));
    });
    it("inserting an object via push wraps the value", function () {
        const ref = new ValueContainer(<Engine>(<unknown>null), [], null, null);
        ref.get().push(123);
        expect(ref.get()[0]).toEqual(new ValueContainer(<Engine>(<unknown>null), 123, ref, null));
    });
});