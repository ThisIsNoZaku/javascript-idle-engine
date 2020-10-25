import { EngineConfiguration } from "../src/EngineConfiguration";
import { Engine } from "../src/Engine";
import {ValueContainer} from "../src/ValueContainer";
import * as ts from "typescript/lib/tsserverlibrary";
import OpenFileInfoTelemetryEvent = ts.server.OpenFileInfoTelemetryEvent;

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
        expect(engine.globals.string).toBeDefined();
    });
    it("creates a container for declared boolean global properties", function () {
        expect(engine.globals.boolean).toBeDefined();
    });
    it("creates a container for declared number global properties", function () {
        expect(engine.globals.number).toBeDefined();
    });
    it("creates a container for declared object global properties", function () {
        expect(engine.globals.object).toBeDefined;
    });
    it("assigning to a global property does not create a new container", function () {
        const originalValue = engine.globals.string;
        engine.globals.string.set("newString");
        expect(engine.globals.string.get()).toEqual("newString");
        expect(originalValue).toBe(engine.globals.string);
    });
    it("calls update on all reference each tick", function () {
        expect(() => engine.tick(1000)).not.toThrow();
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
                updater: EngineConfiguration.configProperty(null, (a: any, b?:any, c?:Engine) => <any>null)
            },
            withStartingValue: EngineConfiguration.configProperty(2)
        }));
        if(engine === undefined) {
            throw new Error();
        }
    });
    it("takes a string or number as a starting value", function () {
        expect(engine.globals.string.get()).toBe("string");
        expect(engine.globals.number.get()).toBe(1);
    });
});