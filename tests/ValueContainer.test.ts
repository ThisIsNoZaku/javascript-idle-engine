import ValueContainer from "../src/ValueContainer";
import Engine from "../src/Engine";

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
    })
});