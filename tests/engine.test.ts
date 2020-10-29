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
        expect(engine.globals.string).toEqual("string");
    });
    it("creates a container for declared boolean global properties", function () {
        expect(engine.globals.boolean).toBeDefined();
        expect(engine.globals.boolean).toEqual(true);
    });
    it("creates a container for declared number global properties", function () {
        expect(engine.globals.number).toBeDefined();
        expect(engine.globals.number).toEqual(1);
    });
    it("creates a container for declared object global properties", function () {
        expect(engine.globals.object).toMatchObject({});
    });
    it("calls update on all reference each tick", function () {
        engine = new Engine(new EngineConfiguration().WithGlobalProperties({
            object: {
                updated: EngineConfiguration.configProperty(0, (current:any) => {
                    return current + 1;
                })
            }
        }));
        expect(() => engine.tick(1000)).not.toThrow();
        expect(engine.globals.object.updated).toEqual(1);
    });
    it("can be paused", function () {
        engine = new Engine(new EngineConfiguration().WithGlobalProperties({
            object: {
                updated: EngineConfiguration.configProperty(0, (current:any) => {
                    return current + 1;
                })
            }
        }));
        engine.start();
        engine.pause();
        expect(engine.globals.object.updated).toBe(0);
    })
});

describe("Managed", function () {
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
        expect(engine.globals.string).toBe("string");
        expect(engine.globals.number).toBe(1);
    });
});