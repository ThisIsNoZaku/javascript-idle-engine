import { EngineConfiguration } from "../src/EngineConfiguration";
import { Engine } from "../src/Engine";
import {ValueContainer} from "../src/ValueContainer";

describe("the engine", function () {
    let engine: Engine;
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
});

describe("Configuring global properties", function () {
    let engine: Engine;
    beforeEach(() => {
        engine = new Engine(new EngineConfiguration().WithGlobalProperties({
            string: "string",
            number: 1,
            boolean: true,
            object: {},
            withUpdater: {
                updater: (e:Engine, p:ValueContainer | null, v:any) => <any>null
            },
            withStartingValue: {
                startingValue: 1
            }
        }));
    });
    it("takes a string or number as a starting value", function () {
        expect(engine.globals.string.get()).toBe("string");
        expect(engine.globals.number.get()).toBe(1);
    });
    it("uses an object to configure a property", function () {
        expect(engine.globals.object.get()).toBeUndefined();
    });
    it("uses the startingValue property of the object", function () {
        expect(engine.globals.withStartingValue.get()).toBe(1);
    })
})