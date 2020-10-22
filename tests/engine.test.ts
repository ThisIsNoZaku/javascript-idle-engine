import { EngineConfiguration } from "../src/EngineConfiguration";
import { Engine } from "../src/Engine";

describe("the engine", function () {
    var engine: Engine;
    beforeEach(() => {
        engine = new Engine(new EngineConfiguration().WithGlobalProperties({
            string: "string",
            number: 1,
            boolean: true,
            object: {}
        }));
    });
    it("creates a container for declared string global properties", function () {
        expect(engine.globals.hasOwnProperty("string")).toBeTruthy();
    });
    it("creates a container for declared boolean global properties", function () {
        expect(engine.globals.hasOwnProperty("boolean")).toBeTruthy();
    });
    it("creates a container for declared number global properties", function () {
        expect(engine.globals.hasOwnProperty("number")).toBeTruthy();
    });
    it("creates a container for declared object global properties", function () {
        expect(engine.globals.hasOwnProperty("object")).toBeTruthy();
    });
    it("assigning to a global property does not create a new container", function () {
        const originalValue = engine.globals.string;
        engine.globals.string.set("newString");
        expect(engine.globals.string.get()).toEqual("newString");
        expect(originalValue).toBe(engine.globals.string);
    });
    it("can define a one-second, half-second, quarter-second or tenth-second internal rate", function () {
        expect(engine.tickRate).toEqual("one-second");
    });
});